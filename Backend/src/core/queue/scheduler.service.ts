import { AccountRepository } from '@modules/accounts/account.repository.js';
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
            const queue = getQueue(QUEUE_NAMES.SYNC_ACCOUNT);

            // Fetch current repeatability states in BullMQ
            const jobSchedulers = await queue.getJobSchedulers();

            // Fetch active/sync-enabled accounts from MongoDB
            const accounts = await AccountRepository.getAccounts({ active: true, syncEnabled: true });
            const activeAccountIds = new Set(accounts.map((acc) => String(acc._id)));

            // 1. Remove jobs that no longer match active criteria or whose intervals changed
            for (const scheduler of jobSchedulers) {
                if (!scheduler.name.startsWith('sync:')) {
                    continue;
                }
                const accountId = scheduler.name.replace('sync:', '');

                if (!accountId || !activeAccountIds.has(accountId)) {
                    logger.info(`⏰ Removing deprecated repeatable job key ${scheduler.key} for account: ${accountId}`);
                    await queue.removeJobScheduler(scheduler.key);
                    continue;
                }

                const account = accounts.find((acc) => String(acc._id) === accountId);
                if (account) {
                    const expectedIntervalMs = account.syncInterval * 60 * 1000;
                    if (scheduler.every !== expectedIntervalMs) {
                        logger.info(`⏰ Interval shift detected for account: ${accountId}. Rebuilding scheduler.`);
                        await queue.removeJobScheduler(scheduler.key);
                    }
                }
            }

            // 2. Register/Ensure repeatable jobs exist for all active accounts
            for (const account of accounts) {
                const accountId = String(account._id);
                const intervalMs = account.syncInterval * 60 * 1000;

                const alreadyRegistered = jobSchedulers.some((scheduler) => {
                    if (!scheduler.name.startsWith('sync:')) {
                        return false;
                    }
                    const rAccountId = scheduler.name.replace('sync:', '');
                    return rAccountId === accountId && scheduler.every === intervalMs;
                });

                if (!alreadyRegistered) {
                    logger.info(`⏰ Registering repeatable sync for account: ${accountId} (Every ${account.syncInterval} mins)`);
                    await queue.add(
                        `sync:${accountId}`,
                        { accountId, userId: account.userId, force: false },
                        {
                            repeat: { every: intervalMs },
                            jobId: `repeat:${accountId}`,
                            priority: 2, // Auto-scheduled runs at lower priority
                        },
                    );
                }
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

            const queue = getQueue(QUEUE_NAMES.SYNC_ACCOUNT);
            const jobSchedulers = await queue.getJobSchedulers();
            const intervalMs = account.syncInterval * 60 * 1000;

            for (const scheduler of jobSchedulers) {
                if (!scheduler.name.startsWith('sync:')) {
                    continue;
                }
                const rAccountId = scheduler.name.replace('sync:', '');
                if (rAccountId === accountId && scheduler.every !== intervalMs) {
                    await queue.removeJobScheduler(scheduler.key);
                }
            }

            logger.info(`⏰ Registering/Updating repeatable sync: ${accountId} (Every ${account.syncInterval} mins)`);
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
}
