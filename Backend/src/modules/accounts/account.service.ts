import { GmailService } from '@providers/gmail/gmail.service.js';
import * as GmailUtils from '@providers/gmail/gmail.utils.js';
import { OutlookService } from '@providers/outlook/outlook.service.js';
import * as OutlookUtils from '@providers/outlook/outlook.utils.js';
import { decrypt, encrypt } from '@utils/crypto.js';
import { logger } from '@utils/logger.js';
import { AccountProvider, AccountProviderType, OutlookOAuthAccessTokenResponse } from 'types/account.types.js';
import { AccountInput } from './account.model.js';
import { AccountRepository } from './account.repository.js';
import { ACCOUNT_PROVIDERS } from '@constants/account.constants.js';
import { MAILSENSE_BASE_URL } from '@config/config.js';
import { GmailApi } from '@providers/gmail/gmail.api.js';
import { MailSyncService } from 'services/mail/mailSync.service.js';

export class AccountsService {
    private gmailService: GmailService;
    private outlookService: OutlookService;
    private gmailApi: GmailApi;
    private emailSyncService: MailSyncService;

    constructor() {
        this.gmailService = new GmailService();
        this.outlookService = new OutlookService();
        this.gmailApi = new GmailApi();
        this.emailSyncService = new MailSyncService();
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
                const account: AccountInput = {
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
                await AccountRepository.upsertAccount(account);
                return MAILSENSE_BASE_URL;
            } else if (provider === AccountProvider.OUTLOOK) {
                const response: OutlookOAuthAccessTokenResponse = await this.outlookService.getAccessTokenFromCode(code);
                const { access_token, refresh_token, expires_in, scope } = response;
                const userProfile = await this.outlookService.getUserProfileFromAccessToken(access_token);
                // Save in db
                const account: AccountInput = {
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
                await AccountRepository.upsertAccount(account);
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
            const emails = await this.gmailApi.fetchEmails(accountId);
            // parse the emails and return only the required fields
            return emails;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.fetchEmails: ${errorMessage}`, { error: err });
            throw err;
        }
    };

    public syncAccount = async (accountId: string): Promise<void> => {
        try {
            await this.emailSyncService.syncAccount('123', accountId);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.syncAccount: ${errorMessage}`, { error: err });
            throw err;
        }
    };
}
