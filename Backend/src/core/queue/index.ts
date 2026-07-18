import { SyncWorker } from 'workers/sync.worker.js';
import { logger } from '../../shared/utils/logger.js';
import { closeAllQueues, initQueueRegistry } from './queue.registry.js';
import { closeRedisConnection } from './redis.connection.js';

let syncWorkerInstance: SyncWorker | null = null;

/**
 * Startup hook for job queue infrastructure
 */
export function initBackgroundJobs(): void {
    logger.info('🚀 Initializing Background Job Queues...');
    initQueueRegistry();

    // Start background worker
    logger.info('👷 Starting Background Worker instances...');
    syncWorkerInstance = new SyncWorker();
    syncWorkerInstance.start();

    logger.info('🚀 Background Job Queues Initialized Successfully');
}

/**
 * Graceful shutdown handler for background job resources
 */
export async function shutdownBackgroundJobs(): Promise<void> {
    logger.info('🛑 Shutting down Background Job Queue resources...');
    try {
        if (syncWorkerInstance) {
            logger.info('🛑 Stopping Sync Worker...');
            await syncWorkerInstance.shutdown();
            syncWorkerInstance = null;
        }
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
