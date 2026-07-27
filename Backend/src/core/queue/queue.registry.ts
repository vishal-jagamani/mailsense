import { ConnectionOptions, Queue } from 'bullmq';
import { logger } from '../../shared/utils/logger.js';
import { QUEUE_NAMES, getQueueConfig } from './queue.config.js';
import { getRedisConnection } from './redis.connection.js';

const registry = new Map<string, Queue>();

/**
 * Initializes and caches all application queues
 */
export function initQueueRegistry(): void {
    const connection = getRedisConnection();
    const queueConfig = getQueueConfig();

    for (const name of Object.values(QUEUE_NAMES)) {
        if (!registry.has(name)) {
            logger.info(`📦 Initializing BullMQ Queue: ${name}`);
            const queue = new Queue(name, {
                ...queueConfig,
                connection: connection as ConnectionOptions,
            });
            registry.set(name, queue);
        }
    }
}

/**
 * Retrieves a registered Queue instance
 */
export function getQueue(name: string): Queue {
    const queue = registry.get(name);
    if (!queue) {
        throw new Error(`❌ Queue "${name}" is not registered. Ensure initQueueRegistry() is called.`);
    }
    return queue;
}

/**
 * Clean up and close all queues
 */
export async function closeAllQueues(): Promise<void> {
    logger.info('📦 Closing all registered queues...');
    for (const [name, queue] of registry.entries()) {
        logger.info(`📦 Closing Queue: ${name}`);
        await queue.close();
    }
    registry.clear();
    logger.info('✅ All queues closed');
}
