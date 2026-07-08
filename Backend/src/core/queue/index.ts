import { logger } from '../../shared/utils/logger.js';
import { closeAllQueues, initQueueRegistry } from './queue.registry.js';
import { closeRedisConnection } from './redis.connection.js';

/**
 * Startup hook for job queue infrastructure
 */
export function initBackgroundJobs(): void {
    logger.info('🚀 Initializing Background Job Queues...');
    initQueueRegistry();
    logger.info('🚀 Background Job Queues Initialized Successfully');
}

/**
 * Graceful shutdown handler for background job resources
 */
export async function shutdownBackgroundJobs(): Promise<void> {
    logger.info('🛑 Shutting down Background Job Queue resources...');
    try {
        await closeAllQueues();
        await closeRedisConnection();
        logger.info('✅ Background Job Queue resources cleaned up');
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error(`❌ Error during background jobs teardown: ${msg}`, { error });
    }
}

export * from './queue.config.js';
export * from './queue.service.js';
