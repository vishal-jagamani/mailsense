import { ACCOUNT_PROVIDERS, LOGGER_MODULE } from '@constants';
import { BadRequestError, ForbiddenError, NotFoundError } from '@errors';
import {
    ACCOUNT_SYNC_JOB_STATUS,
    ACCOUNT_SYNC_JOB_TRIGGER_TYPE,
    AccountProviderType,
    SanitizedAccountAttributes,
    UpdateAPIResponse,
} from '@mailsense/types';
import { EmailRepository } from '@modules/emails/email.repository.js';
import { createLogger } from '@observability';
import { QueueService } from 'core/queue/queue.service.js';
import { SchedulerService } from 'core/queue/scheduler.service.js';
import { AccountOAuthService } from './account-oauth.service.js';
import { AccountDocument } from './account.model.js';
import { AccountRepository } from './account.repository.js';
import { UpdateAccountSettingsSchema } from './account.schema.js';
import { OAuthCallbackParams, OAuthConnectResponse, SyncAccountJobResponse, SyncAccountsResponse } from './account.types.js';
import { SyncJobRepository } from './sync-job.repository.js';

const logger = createLogger(LOGGER_MODULE.ACCOUNT_SERVICE);

export class AccountsService {
    private readonly accountOAuthService: AccountOAuthService;

    constructor(accountOAuthService?: AccountOAuthService) {
        this.accountOAuthService = accountOAuthService || new AccountOAuthService();
    }

    private sanitizeAccount(account: AccountDocument): SanitizedAccountAttributes {
        try {
            return {
                _id: String(account._id),
                userId: account.userId,
                email: account.emailAddress,
                provider: account.provider,
                isEnabled: account.active,
                lastSyncedAt: account.lastSyncedAt ? new Date(account.lastSyncedAt) : undefined,
                lastSyncStatus: account.lastSyncStatus,
                syncFrequency: String(account.syncInterval),
                createdAt: new Date(account.createdAt || ''),
                updatedAt: new Date(account.updatedAt || ''),
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.sanitizeAccount: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    /**
     * Fetches an account from the database by ID.
     * @param accountId The ID of the account to fetch.
     * @returns A promise that resolves to the account document.
     * @throws {Error} When the account is not found in the database.
     * @throws {Error} When there's a database connection error.
     */
    async getAccountDetails(userId: string, accountId: string): Promise<SanitizedAccountAttributes> {
        try {
            const account = await AccountRepository.getAccountById(accountId);
            if (!account) {
                throw new NotFoundError('Account', accountId);
            }
            if (userId && account.userId !== userId) {
                throw new ForbiddenError('Access to specified account is denied');
            }
            return this.sanitizeAccount(account);
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
    async deleteAccount(userId: string, accountId: string): Promise<void> {
        try {
            const account = await AccountRepository.getAccountById(accountId);
            if (!account) {
                throw new NotFoundError('Account', accountId);
            }
            if (account.userId !== userId) {
                throw new ForbiddenError('Cannot delete an account belonging to another user');
            }
            await this.initiateAccountDeletion(accountId);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.deleteAccount: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    private async initiateAccountDeletion(accountId: string): Promise<void> {
        try {
            // Remove repeatable job from scheduler
            await SchedulerService.removeAccountRepeatableJob(accountId);

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
    async getAccounts(userId: string): Promise<SanitizedAccountAttributes[]> {
        try {
            const accounts = await AccountRepository.getAccounts({ userId });
            return accounts.map((acc: AccountDocument) => this.sanitizeAccount(acc));
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
    async connect(provider: string): Promise<OAuthConnectResponse> {
        return this.accountOAuthService.connect(provider);
    }

    /**
     * Handles the callback from the OAuth provider.
     * @param provider The provider for which the callback is being handled.
     * @param params The query parameters from the callback.
     * @returns A promise that resolves when the callback is handled and redirects to the home page.
     */
    async callback(provider: string, params: OAuthCallbackParams): Promise<string> {
        return this.accountOAuthService.handleCallback(provider, params, (userId, accountId) => {
            this.syncAccount(userId, accountId);
        });
    }

    async syncAccounts(userId: string): Promise<SyncAccountsResponse> {
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
                        accountId: String(account._id),
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

    async syncAccount(userId: string, accountId: string): Promise<SyncAccountJobResponse> {
        try {
            logger.info('Account sync requested', { accountId, userId });
            const account = await AccountRepository.getAccountById(accountId);
            if (!account) {
                throw new NotFoundError('Account', accountId);
            }

            if (account.userId !== userId) {
                throw new ForbiddenError('Cannot trigger sync for an account belonging to another user');
            }

            if (!account.active) {
                throw new BadRequestError('Cannot sync disabled account. Please enable account first.');
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
                    accountId: String(account._id),
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

    public async enableAccount(userId: string, accountId: string, active: boolean): Promise<UpdateAPIResponse> {
        try {
            const account = await AccountRepository.getAccountById(accountId);
            if (!account) {
                throw new NotFoundError('Account', accountId);
            }

            if (account.userId !== userId) {
                throw new ForbiddenError('Cannot modify an account belonging to another user');
            }

            await AccountRepository.updateAccount(accountId, { active });
            if (active) {
                await SchedulerService.upsertAccountRepeatableJob(accountId);
            } else {
                await SchedulerService.removeAccountRepeatableJob(accountId);
            }

            return { status: true, message: `Account ${active ? 'enabled' : 'disabled'} successfully` };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.enableAccount: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async updateAccountSettings(userId: string, accountId: string, settings: UpdateAccountSettingsSchema): Promise<UpdateAPIResponse> {
        try {
            const account = await AccountRepository.getAccountById(accountId);
            if (!account) {
                throw new NotFoundError('Account', accountId);
            }
            if (account.userId !== userId) {
                throw new ForbiddenError('Cannot modify settings of an account belonging to another user');
            }

            await AccountRepository.updateAccount(accountId, settings);

            // Re-evaluates schedule in BullMQ
            await SchedulerService.upsertAccountRepeatableJob(accountId);

            return { status: true, message: 'Account settings updated successfully' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.updateAccountSettings: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
