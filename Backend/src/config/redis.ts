import { RedisOptions } from 'ioredis';
import { QueueOptions } from 'bullmq';
import { REDIS_CONFIG } from './config.js';

export const redisConfig: RedisOptions = {
    host: REDIS_CONFIG.host,
    port: REDIS_CONFIG.port,
    password: REDIS_CONFIG.password,
    maxRetriesPerRequest: null,
};

export const defaultQueueOptions: QueueOptions = {
    connection: redisConfig,
    defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
    },
};
