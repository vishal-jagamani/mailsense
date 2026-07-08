import { UPSTASH_REDIS_CONFIG } from '@config';
import { logger } from '@utils';
import { Redis, RedisOptions } from 'ioredis';

let redisInstance: Redis | null = null;

/**
 * Parses Upstash HTTP REST config to build standard TCP TLS Redis options
 */
export const getUpstashRedisOptions = (): RedisOptions => {
    const { url, token } = UPSTASH_REDIS_CONFIG;
    if (!url || !token) {
        throw new Error('❌ Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN config');
    }
    const host = url.replace(/^https?:\/\//, '').replace(/\/$/, '');

    return {
        host,
        port: 6379,
        password: token,
        tls: {},
        maxRetriesPerRequest: null,
        lazyConnect: true,
    };
};

/**
 * Returns a shared Redis connection client for BullMQ
 */
export const getRedisConnection = (): Redis => {
    if (!redisInstance) {
        const options = getUpstashRedisOptions();
        logger.info(`🔌 Connecting to Upstash Redis at ${options.host}:${options.port}...`);

        redisInstance = new Redis(options);
        redisInstance.on('connect', () => {
            logger.info('✅ Connected to Upstash Redis successfully');
        });
        redisInstance.on('error', (err) => {
            logger.error(`❌ Upstash Redis client connection error: ${err.message}`, { error: err });
        });
    }

    return redisInstance!;
};

/**
 * Closes the active Redis connection
 */
export const closeRedisConnection = async (): Promise<void> => {
    if (redisInstance) {
        logger.info('🔌 Closing Upstash Redis connection...');
        await redisInstance.quit();
        redisInstance = null;
        logger.info('✅ Upstash Redis connection closed successfully');
    }
};
