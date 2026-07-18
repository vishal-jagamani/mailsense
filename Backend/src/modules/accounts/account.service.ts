import { MAILSENSE_BASE_URL } from '@config';
import { ACCOUNT_PROVIDERS } from '@constants';
import { EmailProviderFactory } from '@integrations/email/email.provider.factory.js';
import { EmailRepository } from '@modules/emails/email.repository.js';
import { AccountProvider, AccountProviderType, UpdateAPIResponse } from '@types';
import { QueueService } from 'core/queue/queue.service.js';
import * as GmailUtils from 'integrations/gmail/gmail.utils.js';
import * as OutlookUtils from 'integrations/outlook/outlook.utils.js';
import { decrypt, encrypt, logger } from 'shared/utils/index.js';
import { AccountDocument, AccountInput } from './account.model.js';
import { AccountRepository } from './account.repository.js';
import { ACCOUNT_SYNC_JOB_STATUS, ACCOUNT_SYNC_JOB_TRIGGER_TYPE } from './account.types.js';
import { SyncJobRepository } from './sync-job.repository.js';

export class AccountsService {
    constructor() {}

    /**
     * Fetches an account from the database by ID.
     * @param accountId The ID of the account to fetch.
     * @returns A promise that resolves to the account document.
     * @throws {Error} When the account is not found in the database.
     * @throws {Error} When there's a database connection error.
     */
    async getAccountDetails(accountId: string): Promise<AccountDocument> {
        try {
            const account = await AccountRepository.getAccountById(accountId);
            if (!account) throw new Error('Account not found');
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
            return AccountRepository.getAccounts({ userId });
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
    async callback(provider: string, params: { code: string; state: string }): Promise<string> {
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
            const emailProvider = EmailProviderFactory.getProvider(provider as AccountProvider);
            const { access_token, refresh_token, expires_in, scope } = await emailProvider.getAccessTokenFromCode(code);
            const userProfile = await emailProvider.getUserProfileFromAccessToken(access_token);
            const emailAddress = 'email' in userProfile ? userProfile.email : userProfile.mail;
            const account: Partial<AccountInput> = {
                id: Date.now(),
                userId: userDetails?.id,
                provider: provider as AccountProvider,
                emailAddress,
                userProfileDetails: userProfile,
                accessToken: encrypt(access_token),
                refreshToken: encrypt(refresh_token),
                accessTokenExpiry: Date.now() + expires_in * 1000,
                refreshTokenExpiry: expires_in,
                scope,
                syncEnabled: true,
                syncInterval: 60,
                lastSyncedAt: Date.now(),
                active: true,
            };
            const savedAccount = await AccountRepository.upsertAccount(account);
            this.syncAccount(String(savedAccount._id));
            return MAILSENSE_BASE_URL;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.callback: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async syncAccounts(userId: string): Promise<{ status: boolean; message: string; jobIds: string[] }> {
        try {
            const accounts = await AccountRepository.getAccounts({ userId, active: true });
            if (!accounts.length) return { status: true, message: 'Accounts not found', jobIds: [] };

            const jobIds: string[] = [];
            for (const account of accounts) {
                const jobId = await QueueService.addSyncAccountJob(
                    {
                        accountId: String(account._id),
                        userId: account.userId,
                        force: false,
                    },
                    1,
                );

                if (jobId) {
                    jobIds.push(jobId);
                    await SyncJobRepository.createSyncJob({
                        accountId: account._id,
                        bullJobId: jobId,
                        status: ACCOUNT_SYNC_JOB_STATUS.PENDING,
                        triggerType: ACCOUNT_SYNC_JOB_TRIGGER_TYPE.MANUAL,
                        startedAt: Date.now(),
                    });
                }
            }
            return { status: true, message: 'Accounts sync started!', jobIds };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.syncAccounts: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async syncAccount(accountId: string): Promise<{ status: boolean; message: string; jobId?: string }> {
        try {
            logger.info('Account Syncing Requested', { accountId });
            const account = await AccountRepository.getAccountById(accountId);
            if (!account) {
                throw Object.assign(new Error('Account not found'), {
                    status: 404,
                    isOperational: true,
                    description: 'Given account ID does not exist',
                    suggestedAction: 'Please check the account ID',
                });
            }
            if (!account.active) {
                throw Object.assign(new Error('Account is not active'), {
                    status: 400,
                    isOperational: true,
                    description: 'Given account is not active',
                    suggestedAction: 'Please activate the account',
                });
            }

            // Enqueue manual sync job with High Priority (Priority 1)
            const jobId = await QueueService.addSyncAccountJob(
                {
                    accountId,
                    userId: account.userId,
                    force: false,
                },
                1,
            );

            if (jobId) {
                await SyncJobRepository.createSyncJob({
                    accountId: account._id,
                    bullJobId: jobId,
                    status: ACCOUNT_SYNC_JOB_STATUS.PENDING,
                    triggerType: ACCOUNT_SYNC_JOB_TRIGGER_TYPE.MANUAL,
                    startedAt: Date.now(),
                });
            }

            return { status: true, message: 'Account sync queued successfully!', jobId };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.syncAccount: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async enableAccount(accountId: string, active: boolean): Promise<UpdateAPIResponse> {
        try {
            await AccountRepository.updateAccount(accountId, { active });
            return { status: true, message: `Account ${active ? 'enabled' : 'disabled'} successfully` };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.enableAccount: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
