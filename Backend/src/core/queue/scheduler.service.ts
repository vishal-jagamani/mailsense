import { LOGGER_MODULE } from '@constants';
import { ACCOUNT_SYNC_MODE, UserAccountSyncSettings } from '@mailsense/types';
import { AccountRepository } from '@modules/accounts/account.repository.js';
import { UserSettingsRepository } from '@modules/user/user-settings.repository.js';
import { createLogger } from '@observability';
import { QUEUE_NAMES } from './queue.config.js';
import { getQueue } from './queue.registry.js';

const logger = createLogger(LOGGER_MODULE.SCHEDULER_SERVICE);

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

    private static isEligibleForSync(active?: boolean, syncEnabled?: boolean, globalAutoSync?: boolean): boolean {
        if (!active || !syncEnabled) return false;
        return globalAutoSync ?? true;
    }

    private static resolveSyncIntervalMinutes(accountInterval: number, syncMode?: ACCOUNT_SYNC_MODE, globalInterval?: number): number {
        if (syncMode === ACCOUNT_SYNC_MODE.SAME_FOR_ALL && globalInterval) {
            return globalInterval;
        }
        return accountInterval;
    }

    private static async cleanMismatchedSchedulers(accountId: string, intervalMs: number): Promise<void> {
        const queue = getQueue(QUEUE_NAMES.SYNC_ACCOUNT);
        const schedulers = await queue.getJobSchedulers();
        const syncPrefix = 'sync:';

        for (const scheduler of schedulers) {
            if (!scheduler.name.startsWith(syncPrefix)) continue;
            const rAccountId = scheduler.name.replace(syncPrefix, '');
            if (rAccountId === accountId && scheduler.every !== intervalMs) {
                await queue.removeJobScheduler(scheduler.key);
            }
        }
    }

    private static async getSyncSettings(userId?: string): Promise<UserAccountSyncSettings | undefined> {
        if (!userId) return undefined;
        const userSettingsDoc = await UserSettingsRepository.getUserSettings(userId);
        return userSettingsDoc?.account?.syncSettings;
    }

    /**
     * Dynamic upsert when an account triggers activation or updates intervals
     */
    public static async upsertAccountRepeatableJob(accountId: string): Promise<void> {
        try {
            const account = await AccountRepository.getAccountById(accountId);
            const syncSettings = await this.getSyncSettings(account?.userId);

            if (!account || !this.isEligibleForSync(account.active, account.syncEnabled, syncSettings?.globalAutoSync)) {
                await this.removeAccountRepeatableJob(accountId);
                return;
            }

            const intervalMinutes = this.resolveSyncIntervalMinutes(account.syncInterval, syncSettings?.syncMode, syncSettings?.globalSyncInterval);
            const intervalMs = intervalMinutes * 60 * 1000;

            await this.cleanMismatchedSchedulers(accountId, intervalMs);

            logger.info(`⏰ Registering/Updating repeatable sync: ${accountId} (Every ${intervalMinutes} mins)`);
            const queue = getQueue(QUEUE_NAMES.SYNC_ACCOUNT);
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
