import { MAILSENSE_BASE_URL } from '@config/config.js';
import { ACCOUNT_PROVIDERS } from '@constants/account.constants.js';
import { EmailRepository } from '@modules/emails/email.repository.js';
import { GmailApi } from '@providers/gmail/gmail.api.js';
import { GmailService } from '@providers/gmail/gmail.service.js';
import { GetGmailMessagesResponse } from '@providers/gmail/gmail.types.js';
import * as GmailUtils from '@providers/gmail/gmail.utils.js';
import { OutlookService } from '@providers/outlook/outlook.service.js';
import { GetOutlookMessagesResponse } from '@providers/outlook/outlook.types.js';
import * as OutlookUtils from '@providers/outlook/outlook.utils.js';
import { decrypt, encrypt } from '@utils/crypto.js';
import { logger } from '@utils/logger.js';
import { AccountProvider, AccountProviderType, OutlookOAuthAccessTokenResponse } from 'types/account.types.js';
import { AccountDocument, AccountInput } from './account.model.js';
import { AccountRepository } from './account.repository.js';
// import { MailSyncService } from 'services/mail/mailSync.service.js';

export class AccountsService {
    private gmailService: GmailService;
    private outlookService: OutlookService;
    private gmailApi: GmailApi;
    // private emailSyncService: MailSyncService;

    constructor() {
        this.gmailService = new GmailService();
        this.outlookService = new OutlookService();
        this.gmailApi = new GmailApi();
        // this.emailSyncService = new MailSyncService();
    }

    /**
     * Fetches an account from the database.
     * @param accountId The ID of the account to fetch.
     * @returns A promise that resolves to the account.
     */
    async getAccountDetails(accountId: string): Promise<AccountDocument | null> {
        try {
            const account = await AccountRepository.getAccountById(accountId);
            if (!account) return null;
            return account;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.getAccountDetails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    /**
     * Deletes an account from the database.
     * @param accountId The ID of the account to delete.
     * @returns A promise that resolves when the account is deleted.
     */
    async deleteAccount(accountId: string): Promise<void> {
        try {
            await this.initiateAccountDeletion(accountId);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.deleteAccount: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    private async initiateAccountDeletion(accountId: string): Promise<void> {
        try {
            // Delete account from db
            await AccountRepository.deleteAccount(accountId);
            // Delete emails related to this account
            await EmailRepository.deleteEmailsByAccountId(accountId);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.initiateAccountDeletion: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    /**
     * Fetches all accounts from the database.
     * @returns A promise that resolves to an array of accounts.
     */
    async getAccounts(userId: string): Promise<AccountInput[]> {
        try {
            return AccountRepository.getAccounts(userId);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.getAccounts: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    /**
     * Fetches all accounts from the database.
     * @returns A promise that resolves to an array of account providers.
     */
    async getAccountProviders(): Promise<AccountProviderType[]> {
        try {
            return ACCOUNT_PROVIDERS;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.getAccountProviders: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    /**
     * Generates an OAuth consent URL for the given provider.
     * @param provider The provider for which to generate the consent URL.
     * @returns A promise that resolves to the consent URL & redirects to it.
     */
    async connect(provider: string): Promise<{ url: string }> {
        try {
            if (provider === AccountProvider.GMAIL) {
                const url = await GmailUtils.buildGmailOAuthConsentURL();
                return { url };
            } else if (provider === AccountProvider.OUTLOOK) {
                const url = await OutlookUtils.buildOutlookOAuthConsentURL();
                return { url };
            } else {
                throw new Error('Invalid provider');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.connect: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    /**
     * Handles the callback from the OAuth provider.
     * @param provider The provider for which the callback is being handled.
     * @param params The query parameters from the callback.
     * @returns A promise that resolves when the callback is handled and redirects to the home page.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async callback(provider: string, params: any): Promise<string> {
        try {
            const { code, state } = params;
            let userDetails;
            try {
                const decryptedState = decrypt(state);
                userDetails = JSON.parse(decryptedState);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                logger.error(`Error in AccountsService.callback: ${errorMessage}`, { error: err });
                throw err;
            }
            if (provider === AccountProvider.GMAIL) {
                const accessTokenResponse = await this.gmailService.getAccessTokenFromCode(code);
                const { access_token, refresh_token, expires_in, scope } = accessTokenResponse;
                const userProfile = await this.gmailService.getUserProfileFromAccessToken(access_token);
                // Save in db
                const account: Partial<AccountInput> = {
                    id: Date.now(),
                    userId: userDetails?.id,
                    provider: AccountProvider.GMAIL,
                    emailAddress: userProfile?.email,
                    userProfileDetails: userProfile,
                    accessToken: encrypt(access_token),
                    refreshToken: encrypt(refresh_token),
                    accessTokenExpiry: Date.now() + expires_in * 1000,
                    refreshTokenExpiry: expires_in,
                    scope,
                    syncEnabled: true,
                    syncInterval: 60,
                    lastSyncedAt: Date.now(),
                };

                const savedAccount = await AccountRepository.upsertAccount(account);
                this.syncAccount(String(savedAccount.id));
                return MAILSENSE_BASE_URL;
            } else if (provider === AccountProvider.OUTLOOK) {
                const response: OutlookOAuthAccessTokenResponse = await this.outlookService.getAccessTokenFromCode(code);
                const { access_token, refresh_token, expires_in, scope } = response;
                const userProfile = await this.outlookService.getUserProfileFromAccessToken(access_token);
                // Save in db
                const account: Partial<AccountInput> = {
                    id: Date.now(),
                    userId: userDetails?.id,
                    provider: AccountProvider.OUTLOOK,
                    emailAddress: userProfile?.mail,
                    userProfileDetails: userProfile,
                    accessToken: encrypt(access_token),
                    refreshToken: encrypt(refresh_token),
                    accessTokenExpiry: Date.now() + expires_in * 1000,
                    refreshTokenExpiry: expires_in,
                    scope,
                    syncEnabled: true,
                    syncInterval: 60,
                    lastSyncedAt: Date.now(),
                };
                const savedAccount = await AccountRepository.upsertAccount(account);
                this.syncAccount(String(savedAccount.id));
                return MAILSENSE_BASE_URL;
            } else {
                throw new Error('Invalid provider');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.callback: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public fetchEmails = async (accountId: string): Promise<any> => {
        try {
            const emails = await this.gmailService.getMessages(accountId);
            // parse the emails and return only the required fields
            return emails;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.fetchEmails: ${errorMessage}`, { error: err });
            throw err;
        }
    };

    async syncAccounts(): Promise<void> {
        try {
            // await this.emailSyncService.syncAccounts();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.syncAccounts: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async syncAccount(accountId: string): Promise<void> {
        try {
            const account = await AccountRepository.getAccountById(accountId);
            if (!account) throw new Error('Account not found');
            let emails: GetGmailMessagesResponse | GetOutlookMessagesResponse = { emails: [], lastSyncCursor: '' };
            if (account.provider === AccountProvider.GMAIL) {
                emails = await this.gmailService.getMessages(accountId);
            } else if (account.provider === AccountProvider.OUTLOOK) {
                emails = await this.outlookService.getMessages(accountId);
            }
            await EmailRepository.upsertEmailsInBulk(emails.emails);
            const updateAccountSyncDetails: Partial<AccountInput> = {
                lastSyncedAt: Date.now(),
                lastSyncCursor: emails.lastSyncCursor,
            };
            await AccountRepository.updateAccount(accountId, updateAccountSyncDetails);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.syncAccount: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
