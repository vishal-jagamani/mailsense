import { logger } from '../../shared/utils/logger.js';
import { QUEUE_NAMES } from './queue.config.js';
import { getQueue } from './queue.registry.js';

export interface SyncAccountPayload {
    accountId: string;
    userId: string;
    force?: boolean;
}

export class QueueService {
    /**
     * Enqueues a sync job for a specific user email account
     */
    public static async addSyncAccountJob(payload: SyncAccountPayload, priority: number = 2): Promise<string | undefined> {
        try {
            const queue = getQueue(QUEUE_NAMES.SYNC_ACCOUNT);
            const jobName = `sync:${payload.accountId}`;

            const job = await queue.add(jobName, payload, { priority });

            logger.info(`✉️ Job ${job.id} successfully added to queue ${QUEUE_NAMES.SYNC_ACCOUNT} (Priority: ${priority})`);
            return job.id;
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error(`❌ Failed to enqueue sync account job: ${msg}`, { error, payload });
            throw error;
        }
    }
}
