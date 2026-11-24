import { LOGGER_MODULE } from '@constants';
import { BadRequestError, ForbiddenError, NotFoundError } from '@errors';
import { ACCOUNT_SYNC_JOB_TRIGGER_TYPE, UpdateAPIResponse } from '@mailsense/types';
import { EmailRepository } from '@modules/emails/database/index.js';
import { createLogger } from '@observability';
import { QueueService, SchedulerService } from '@queue';
import { AccountRepository } from '../database/index.js';
import { UpdateAccountSettingsSchema } from '../schema/index.js';
import { SyncAccountJobResponse, SyncAccountsResponse } from '../types/index.js';

const logger = createLogger(LOGGER_MODULE.ACCOUNT_SERVICE);

export class AccountsWriteService {
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

    async syncAccounts(userId: string): Promise<SyncAccountsResponse> {
        try {
            const accounts = await AccountRepository.getAccounts({ userId, active: true });
            if (!accounts.length) return { status: true, message: 'Accounts not found', jobIds: [] };

            const jobIds: string[] = [];
            for (const account of accounts) {
                const jobId = await this.dispatchSyncJob(userId, String(account._id));
                if (jobId) jobIds.push(jobId);
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
            const jobId = await this.dispatchSyncJob(userId, String(account._id));

            return { status: true, message: 'Account sync queued successfully!', jobId };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.syncAccount: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    private async dispatchSyncJob(userId: string, accountId: string): Promise<string | undefined> {
        try {
            const jobId = await QueueService.addSyncAccountJob(
                {
                    accountId,
                    userId,
                    force: false,
                    triggerType: ACCOUNT_SYNC_JOB_TRIGGER_TYPE.MANUAL,
                },
                1,
            );

            return jobId;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.dispatchSyncJob: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
