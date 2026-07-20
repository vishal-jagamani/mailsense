import { ConnectionOptions, QueueOptions } from 'bullmq';
import { getRedisConnection } from './redis.connection.js';

export const QUEUE_NAMES = {
    SYNC_ACCOUNT: 'sync-account',
    REFRESH_TOKEN: 'refresh-token',
} as const;

export type QueueNameType = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// Default configuration for jobs
export const DEFAULT_JOB_OPTIONS = {
    attempts: 3,
    backoff: {
        type: 'exponential' as const,
        delay: 5000,
    },
    removeOnComplete: {
        age: 24 * 3600,
        count: 1000,
    },
    removeOnFail: {
        age: 7 * 24 * 3600,
    },
};

// BullMQ Queue Configuration
export function getQueueConfig(connection?: ConnectionOptions): QueueOptions {
    return {
        connection: connection || getRedisConnection(),
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
    };
}
