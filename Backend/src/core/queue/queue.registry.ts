import { LOGGER_MODULE } from '@constants';
import { createLogger } from '@observability';
import { ConnectionOptions, Queue } from 'bullmq';
import { getQueueConfig, QUEUE_NAMES } from './queue.config.js';
import { getRedisConnection } from './redis.connection.js';
import { NotFoundError } from '@errors';

const logger = createLogger(LOGGER_MODULE.QUEUE_REGISTRY);

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
        throw new NotFoundError('Queue', name);
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
