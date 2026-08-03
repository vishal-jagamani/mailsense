import { REDIS_CONFIG } from '@config';
import { logger } from '@utils';
import { Redis, RedisOptions } from 'ioredis';

let redisInstance: Redis | null = null;

/**
 * Builds standard ioredis options for Aiven / standard Redis (with Upstash fallback)
 */
export const getRedisOptions = (): RedisOptions => ({
    lazyConnect: true,
    maxRetriesPerRequest: null,
    retryStrategy: (times) => Math.min(100 * 2 ** times, 5000),
});

/**
 * Returns a shared Redis connection client for BullMQ
 */
export const getRedisConnection = (): Redis => {
    if (redisInstance) {
        return redisInstance;
    }

    const redisUrl = REDIS_CONFIG.url || process.env.SERVICE_URI;

    if (!redisUrl) {
        throw new Error('Redis connection URL is missing. Please configure REDIS_URL or SERVICE_URI.');
    }

    logger.info(`🔌 Connecting to Redis`);

    redisInstance = new Redis(redisUrl, getRedisOptions());

    redisInstance.on('connect', () => {
        logger.info('✅ Connected to Redis successfully');
    });

    redisInstance.on('ready', () => {
        logger.info('✅ Redis client is ready.');
    });

    redisInstance.on('reconnecting', () => {
        logger.warn('⚠️ Redis client reconnecting...');
    });

    redisInstance.on('end', () => {
        logger.warn('⚠️ Redis connection closed.');
    });

    redisInstance.on('error', (err) => {
        logger.error(`❌ Redis client connection error: ${err.message}`, { error: err });
    });

    return redisInstance!;
};

/**
 * Closes the active Redis connection
 */
export const closeRedisConnection = async (): Promise<void> => {
    if (!redisInstance) {
        return;
    }

    logger.info('🔌 Closing Redis connection...');

    try {
        await redisInstance.quit();
    } catch (error) {
        logger.warn('⚠️ Graceful Redis shutdown failed. Forcing disconnect.', {
            error,
        });

        redisInstance.disconnect();
    } finally {
        redisInstance = null;
    }

    logger.info('✅ Redis connection closed successfully');
};
