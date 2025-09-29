import { defaultQueueOptions } from '@config/redis.js';
import { logger } from '@utils/logger.js';
import { Job, Worker } from 'bullmq';
import { MailSyncService } from 'services/mail/mailSync.service.js';

export const mailSyncWorker = new Worker(
    'mailQueue',
    async (job: Job<{ userId: string; accountId: string }>) => {
        const { userId, accountId } = job.data;

        const mailSyncService = new MailSyncService();
        await mailSyncService.syncAccount(userId, accountId);

        return { status: true, userId, accountId };
    },
    defaultQueueOptions,
);

mailSyncWorker.on('completed', (job: Job<{ userId: string; accountId: string }>) => {
    logger.info(`Job ${job.id} completed`);
});

mailSyncWorker.on('failed', (job: Job<{ userId: string; accountId: string }> | undefined, err: Error, prev: string) => {
    if (!job) {
        logger.error('❌ Failed job is undefined:', { error: err.message });
        return;
    }
    logger.error(`❌ Job ${job.id} failed for account ${job.data.accountId}. Prev status: ${prev}`, { error: err.message });
});

mailSyncWorker.on('paused', () => {
    logger.info('Mail sync worker paused');
});
