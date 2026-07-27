import { initSystemEvents } from 'core/events/index.js';
import { SyncWorker } from 'workers/sync.worker.js';
import { TokenRefreshWorker } from 'workers/token-refresh.worker.js';
import { logger } from '../../shared/utils/logger.js';
import { closeAllQueues, initQueueRegistry } from './queue.registry.js';
import { closeRedisConnection } from './redis.connection.js';
import { SchedulerService } from './scheduler.service.js';

let syncWorkerInstance: SyncWorker | null = null;
let tokenRefreshWorkerInstance: TokenRefreshWorker | null = null;

/**
 * Startup hook for job queue infrastructure
 */
export function initBackgroundJobs(): void {
    logger.info('🚀 Initializing Background Job Queues...');
    initQueueRegistry();

    // Initialize System Event Handlers on startup
    initSystemEvents();

    // Start background workers
    logger.info('👷 Starting Background Worker instances...');
    syncWorkerInstance = new SyncWorker();
    syncWorkerInstance.start();

    tokenRefreshWorkerInstance = new TokenRefreshWorker();
    tokenRefreshWorkerInstance.start();

    // Initialize dynamic schedulers
    SchedulerService.init().catch((error) => {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error(`❌ Failed to initialize scheduler service: ${msg}`, { error });
    });

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
        if (tokenRefreshWorkerInstance) {
            logger.info('🛑 Stopping Token Refresh Worker...');
            await tokenRefreshWorkerInstance.shutdown();
            tokenRefreshWorkerInstance = null;
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
