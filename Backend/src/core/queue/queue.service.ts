import { LOGGER_MODULE } from '@constants';
import { AIProcessingJobPayload } from '@mailsense/types';
import { createLogger } from '@observability';
import { EnqueueJobOptions, RefreshTokenPayload, SyncAccountPayload } from '@types';
import { QUEUE_NAMES } from './queue.config.js';
import { getQueue } from './queue.registry.js';

const logger = createLogger(LOGGER_MODULE.QUEUE_SERVICE);

export class QueueService {
    // Enqueues a sync job for a specific user email account
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

    // Enqueues a token refresh job
    public static async addRefreshTokenJob(payload: RefreshTokenPayload): Promise<string | undefined> {
        try {
            const queue = getQueue(QUEUE_NAMES.REFRESH_TOKEN);
            const jobName = `refresh:${payload.accountId}`;

            const job = await queue.add(jobName, payload, {
                attempts: 2,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
            });

            logger.info(`🔄 Job ${job.id} successfully added to queue ${QUEUE_NAMES.REFRESH_TOKEN}`);
            return job.id;
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error(`❌ Failed to enqueue token refresh job: ${msg}`, { error, payload });
            throw error;
        }
    }

    // Enqueues an AI classification and triage job for an ingested email
    public static async enqueueAiProcessingJob(payload: AIProcessingJobPayload, options?: EnqueueJobOptions): Promise<string | undefined> {
        try {
            const queue = getQueue(QUEUE_NAMES.AI_PROCESSING);
            const jobName = `ai:${payload.emailId}`;

            const job = await queue.add(jobName, payload, {
                priority: options?.priority ?? 3,
                delay: options?.delay ?? 0,
                attempts: options?.attempts ?? 3,
                backoff: {
                    type: 'exponential',
                    delay: 3000,
                },
            });

            logger.info(`🤖 Job ${job.id} successfully added to queue ${QUEUE_NAMES.AI_PROCESSING}`, {
                jobId: job.id,
                emailId: payload.emailId,
                accountId: payload.accountId,
            });
            return job.id;
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error(`❌ Failed to enqueue AI processing job: ${msg}`, {
                error,
                payload,
            });
            throw error;
        }
    }
}
