import { Job } from 'bullmq';

import { LOGGER_MODULE } from '@constants';
import { createLogger } from '@observability';
import { QUEUE_NAMES } from '../core/queue/queue.config.js';
import { RefreshTokenPayload } from '../core/queue/queue.service.js';
import { BaseWorker } from './base.worker.js';
import { refreshTokenProcessor } from './processors/refresh-token.processor.js';
import { SuccessStatusResponse } from '@types';

const logger = createLogger(LOGGER_MODULE.TOKEN_REFRESH_WORKER);

export class TokenRefreshWorker extends BaseWorker<RefreshTokenPayload, SuccessStatusResponse> {
    protected queueName = QUEUE_NAMES.REFRESH_TOKEN;

    protected async processJob(job: Job<RefreshTokenPayload, SuccessStatusResponse>): Promise<SuccessStatusResponse> {
        return refreshTokenProcessor(job);
    }

    protected async onActive(job: Job<RefreshTokenPayload, SuccessStatusResponse>): Promise<void> {
        logger.info(`🔄 Token Refresh Worker started processing job: ${job.id}`);
    }

    protected async onCompleted(job: Job<RefreshTokenPayload, SuccessStatusResponse>, _result: SuccessStatusResponse): Promise<void> {
        logger.info(`🔄 Token Refresh Worker completed job: ${job.id}`);
    }

    protected async onFailed(job: Job<RefreshTokenPayload, SuccessStatusResponse> | undefined, error: Error): Promise<void> {
        logger.error(`❌ Token Refresh Worker failed job: ${job?.id} with error: ${error.message}`, { error });
    }
}
