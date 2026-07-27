import { logger } from '@utils';
import { Job } from 'bullmq';
import { refreshTokenProcessor } from './processors/refresh-token.processor.js';
import { QUEUE_NAMES } from '../core/queue/queue.config.js';
import { RefreshTokenPayload } from '../core/queue/queue.service.js';
import { BaseWorker } from './base.worker.js';

export class TokenRefreshWorker extends BaseWorker<RefreshTokenPayload, { status: boolean }> {
    protected queueName = QUEUE_NAMES.REFRESH_TOKEN;

    protected async processJob(job: Job<RefreshTokenPayload, { status: boolean }>): Promise<{ status: boolean }> {
        return refreshTokenProcessor(job);
    }

    protected async onActive(job: Job<RefreshTokenPayload, { status: boolean }>): Promise<void> {
        logger.info(`🔄 Token Refresh Worker started processing job: ${job.id}`);
    }

    protected async onCompleted(job: Job<RefreshTokenPayload, { status: boolean }>, _result: { status: boolean }): Promise<void> {
        logger.info(`🔄 Token Refresh Worker completed job: ${job.id}`);
    }

    protected async onFailed(job: Job<RefreshTokenPayload, { status: boolean }> | undefined, error: Error): Promise<void> {
        logger.error(`❌ Token Refresh Worker failed job: ${job?.id} with error: ${error.message}`, { error });
    }
}
