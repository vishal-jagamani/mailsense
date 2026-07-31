import { ACCOUNT_SYNC_MODE } from '@mailsense/types';
import { AccountRepository } from '@modules/accounts/account.repository.js';
import { UserSettingsRepository } from '@modules/user/user-settings.repository.js';
import { logger } from '@utils';
import { QUEUE_NAMES } from './queue.config.js';
import { getQueue } from './queue.registry.js';

export class SchedulerService {
    /**
     * Scans database and synchronizes repeatable BullMQ jobs.
     * Recreates repeatable jobs if sync intervals change.
     */
    public static async init(): Promise<void> {
        try {
            logger.info('⏰ Syncing background schedules with MongoDB...');
            const accounts = await AccountRepository.getAccounts({ active: true, syncEnabled: true });

            for (const account of accounts) {
                const userSettingsDoc = await UserSettingsRepository.getUserSettings(account.userId);
                const globalAutoSync = userSettingsDoc?.account?.syncSettings?.globalAutoSync ?? true;

                if (!globalAutoSync) {
                    await this.removeAccountRepeatableJob(String(account._id));
                    continue;
                }

                await this.upsertAccountRepeatableJob(String(account._id));
            }
            logger.info('⏰ Background schedules synchronized successfully');
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error(`❌ Failed to sync repeatable schedulers: ${msg}`, { error });
            throw error;
        }
    }

    /**
     * Dynamic upsert when an account triggers activation or updates intervals
     */
    public static async upsertAccountRepeatableJob(accountId: string): Promise<void> {
        try {
            const account = await AccountRepository.getAccountById(accountId);
            if (!account || !account.active || !account.syncEnabled) {
                await this.removeAccountRepeatableJob(accountId);
                return;
            }

            const userSettingsDoc = await UserSettingsRepository.getUserSettings(account.userId);
            const syncSettings = userSettingsDoc?.account?.syncSettings;
            const globalAutoSync = syncSettings?.globalAutoSync ?? true;
            if (!globalAutoSync) {
                await this.removeAccountRepeatableJob(accountId);
                return;
            }

            const queue = getQueue(QUEUE_NAMES.SYNC_ACCOUNT);
            const jobSchedulers = await queue.getJobSchedulers();

            let intervalMinutes = account.syncInterval;
            if (syncSettings?.syncMode === ACCOUNT_SYNC_MODE.SAME_FOR_ALL && syncSettings.globalSyncInterval) {
                intervalMinutes = syncSettings.globalSyncInterval;
            }

            const intervalMs = intervalMinutes * 60 * 1000;

            for (const scheduler of jobSchedulers) {
                if (!scheduler.name.startsWith('sync:')) {
                    continue;
                }
                const rAccountId = scheduler.name.replace('sync:', '');
                if (rAccountId === accountId && scheduler.every !== intervalMs) {
                    await queue.removeJobScheduler(scheduler.key);
                }
            }

            logger.info(`⏰ Registering/Updating repeatable sync: ${accountId} (Every ${intervalMinutes} mins)`);
            await queue.add(
                `sync:${accountId}`,
                { accountId, userId: account.userId, force: false },
                {
                    repeat: { every: intervalMs },
                    jobId: `repeat:${accountId}`,
                    priority: 2,
                },
            );
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error(`❌ Failed to upsert repeatable job: ${msg}`, { error, accountId });
            throw error;
        }
    }

    /**
     * Remove repeatable jobs when deactivated/deleted
     */
    public static async removeAccountRepeatableJob(accountId: string): Promise<void> {
        try {
            const queue = getQueue(QUEUE_NAMES.SYNC_ACCOUNT);
            const jobSchedulers = await queue.getJobSchedulers();

            for (const scheduler of jobSchedulers) {
                if (!scheduler.name.startsWith('sync:')) {
                    continue;
                }
                const rAccountId = scheduler.name.replace('sync:', '');
                if (rAccountId === accountId) {
                    logger.info(`⏰ Deleting repeatable sync schedule: ${accountId}`);
                    await queue.removeJobScheduler(scheduler.key);
                }
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error(`❌ Failed to delete repeatable sync job: ${msg}`, { error, accountId });
            throw error;
        }
    }

    /**
     * Remove all repeatable sync jobs belonging to a specific user
     */
    public static async removeAllUserRepeatableJobs(userId: string): Promise<void> {
        try {
            const accounts = await AccountRepository.getAccounts({ userId });
            for (const account of accounts) {
                await this.removeAccountRepeatableJob(String(account._id));
            }
            logger.info(`⏰ Removed all repeatable sync jobs for user: ${userId}`);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error(`❌ Failed to remove user repeatable jobs: ${msg}`, { error, userId });
            throw error;
        }
    }
}
