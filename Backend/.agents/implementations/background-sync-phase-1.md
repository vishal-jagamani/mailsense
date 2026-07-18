# MailSense Background Sync System - Phase 1 Implementation Plan

This plan details the setup of the Queue Engine infrastructure using **BullMQ** and **Upstash Redis** (via standard TCP/TLS protocol) for Phase 1 of the asynchronous synchronization pipeline.

---

## Goal Description

Implement Phase 1 of the background sync roadmap by setting up the queuing infrastructure using BullMQ connected to the Upstash Redis free tier. The connection needs to use standard TCP over TLS since BullMQ requires a persistent connection for Lua scripting, pub/sub, and blocking queues. We will parse the host, port, and password from the existing `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` environment variables to avoid requiring new configuration values.

---

## User Review Required

> [!IMPORTANT]
> **Upstash Redis Connection Mode & TLS**
> Upstash Redis requires TLS (`rediss://` protocol) on port `6379`. To make BullMQ work with Upstash Redis using the standard `ioredis` client, we:
>
> 1. Parse the host from `UPSTASH_REDIS_REST_URL` (stripping the `https://` prefix).
> 2. Use `UPSTASH_REDIS_REST_TOKEN` as the Redis password.
> 3. Specify port `6379`.
> 4. Pass `tls: {}` in the `ioredis` constructor.
> 5. Set `maxRetriesPerRequest: null` (required by BullMQ).

---

## Proposed Changes

### Queue Core Infrastructure

#### [NEW] [redis.connection.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/core/queue/redis.connection.ts)

Creates and manages the singleton `Redis` connection instance. It extracts host and password dynamically from `UPSTASH_REDIS_CONFIG` and configures it with TLS.

#### [NEW] [queue.config.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/core/queue/queue.config.ts)

Defines type contracts, constants, and default configurations for the queues (e.g., retry backoff strategy, clean-up policies).

#### [NEW] [queue.registry.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/core/queue/queue.registry.ts)

Declares and registers the BullMQ `Queue` instances (specifically the `sync-account` queue) to avoid duplicate instantiations.

#### [NEW] [queue.service.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/core/queue/queue.service.ts)

Exposes strongly typed helper methods to add jobs to the queues.

#### [NEW] [index.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/core/queue/index.ts)

Provides setup (`initBackgroundJobs`) and teardown (`shutdownBackgroundJobs`) hooks for the queue system.

---

### Configuration & Bootstrapping

#### [MODIFY] [app.config.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/core/config/app.config.ts)

Re-exports or adjusts config if necessary. (We will export parsed values for ease of use in the connection module).

#### [MODIFY] [server.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/server.ts)

Integrates queue initialization on startup and graceful shutdown listeners to close queue/Redis connections on `SIGINT` and `SIGTERM`.

---

### Testing

#### [NEW] [queue.service.test.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/tests/core/queue/__tests__/queue.service.test.ts)

An integration test verifying connectivity to Upstash Redis and successfully pushing a job onto the queue.

---

## File Contents

Below are the complete file contents proposed for creation or modification.

### 1. `src/core/queue/redis.connection.ts`

```typescript
import { Redis, RedisOptions } from 'ioredis';
import { UPSTASH_REDIS_CONFIG } from '@config';
import { logger } from '../../shared/utils/logger.js';

let redisInstance: Redis | null = null;

/**
 * Parses Upstash HTTP REST config to build standard TCP TLS Redis options
 */
export function getUpstashRedisOptions(): RedisOptions {
    const { url, token } = UPSTASH_REDIS_CONFIG;

    if (!url || !token) {
        throw new Error('❌ Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN config');
    }

    // Extract host from https://host
    const host = url.replace(/^https?:\/\//, '').replace(/\/$/, '');

    return {
        host,
        port: 6379,
        password: token,
        tls: {}, // Required for Upstash SSL connection
        maxRetriesPerRequest: null, // Required by BullMQ
        lazyConnect: true,
    };
}

/**
 * Returns a shared Redis connection client for BullMQ
 */
export function getRedisConnection(): Redis {
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

    return redisInstance;
}

/**
 * Closes the active Redis connection
 */
export async function closeRedisConnection(): Promise<void> {
    if (redisInstance) {
        logger.info('🔌 Closing Upstash Redis connection...');
        await redisInstance.quit();
        redisInstance = null;
        logger.info('✅ Upstash Redis connection closed successfully');
    }
}
```

### 2. `src/core/queue/queue.config.ts`

```typescript
import { QueueOptions } from 'bullmq';

export const QUEUE_NAMES = {
    SYNC_ACCOUNT: 'sync-account',
} as const;

export type QueueNameType = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// Default configuration for jobs
export const DEFAULT_JOB_OPTIONS = {
    attempts: 3,
    backoff: {
        type: 'exponential' as const,
        delay: 5000, // Starts with 5s
    },
    removeOnComplete: {
        age: 24 * 3600, // Keep completed jobs for 24 hours
        count: 1000,
    },
    removeOnFail: {
        age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
};

// BullMQ Queue Configuration
export function getQueueConfig(): QueueOptions {
    return {
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
    };
}
```

### 3. `src/core/queue/queue.registry.ts`

```typescript
import { Queue } from 'bullmq';
import { QUEUE_NAMES, getQueueConfig } from './queue.config.js';
import { getRedisConnection } from './redis.connection.js';
import { logger } from '../../shared/utils/logger.js';

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
                connection,
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
```

### 4. `src/core/queue/queue.service.ts`

```typescript
import { QUEUE_NAMES } from './queue.config.js';
import { getQueue } from './queue.registry.js';
import { logger } from '../../shared/utils/logger.js';

export interface SyncAccountPayload {
    accountId: string;
    userId: string;
    force?: boolean;
}

export class QueueService {
    /**
     * Enqueues a sync job for a specific user email account
     */
    public static async addSyncAccountJob(payload: SyncAccountPayload, priority: number = 2): Promise<string | undefined> {
        try {
            const queue = getQueue(QUEUE_NAMES.SYNC_ACCOUNT);
            const jobName = `sync:${payload.accountId}`;

            const job = await queue.add(jobName, payload, {
                priority,
                // Manual trigger (priority: 1) should override normal trigger (priority: 2)
            });

            logger.info(`✉️ Job ${job.id} successfully added to queue ${QUEUE_NAMES.SYNC_ACCOUNT} (Priority: ${priority})`);
            return job.id;
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error(`❌ Failed to enqueue sync account job: ${msg}`, { error, payload });
            throw error;
        }
    }
}
```

### 5. `src/core/queue/index.ts`

```typescript
import { initQueueRegistry, closeAllQueues } from './queue.registry.js';
import { closeRedisConnection } from './redis.connection.js';
import { logger } from '../../shared/utils/logger.js';

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

export * from './queue.service.js';
export * from './queue.config.js';
```

### 6. `src/core/config/app.config.ts` (Modifications only)

We will add standard TLS support checks to `REDIS_CONFIG` and extend configs for readability if needed, but since `UPSTASH_REDIS_CONFIG` is already present, we will keep modifications minimum, just exporting `UPSTASH_REDIS_CONFIG` and making sure it imports correctly. No actual file edits are needed if `UPSTASH_REDIS_CONFIG` is already exposed. We'll simply reference it.

### 7. `src/server.ts`

```typescript
import { connectDB, PORT } from '@config';
import { App } from './app.js';
import './instruction.mjs';
import { logger } from './shared/utils/logger.js';
import { initBackgroundJobs, shutdownBackgroundJobs } from './core/queue/index.js';

// Create app instance
const appInstance = new App();
const app = appInstance.expressApp;

const startServer = async () => {
    try {
        // Connect MongoDB (with pooling)
        await connectDB();

        // Initialize Background Queues
        initBackgroundJobs();

        // Start Express only after DB is ready
        const server = app.listen(PORT, () => {
            logger.info(`🚀 MailSense Backend is running on port ${PORT}`);
        });

        // Graceful shutdown helper
        const gracefulShutdown = async (signal: string) => {
            logger.info(`Received ${signal}. Starting graceful shutdown...`);

            // Close background jobs & Redis connections
            await shutdownBackgroundJobs();

            // Close server HTTP connections
            server.close(() => {
                logger.info('HTTP server closed.');
                process.exit(0);
            });

            // Force close if server takes too long to shut down
            setTimeout(() => {
                logger.warn('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);
        };

        // Capture termination signals
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`❌ Failed to start server: ${errorMessage}`, { error });
        process.exit(1);
    }
};

// Start server
startServer();
```

### 8. `tests/core/queue/__tests__/queue.service.test.ts`

```typescript
import { QueueService } from '../../../../src/core/queue/queue.service.js';
import { initQueueRegistry, closeAllQueues, getQueue } from '../../../../src/core/queue/queue.registry.js';
import { closeRedisConnection } from '../../../../src/core/queue/redis.connection.js';
import { QUEUE_NAMES } from '../../../../src/core/queue/queue.config.js';

describe('QueueService Integration Test', () => {
    beforeAll(() => {
        initQueueRegistry();
    });

    afterAll(async () => {
        await closeAllQueues();
        await closeRedisConnection();
    });

    it('should successfully add a sync job to the sync-account queue', async () => {
        const payload = {
            accountId: 'test-account-123',
            userId: 'test-user-456',
            force: true,
        };

        const jobId = await QueueService.addSyncAccountJob(payload, 1);
        expect(jobId).toBeDefined();

        const queue = getQueue(QUEUE_NAMES.SYNC_ACCOUNT);
        const job = await queue.getJob(jobId!);

        expect(job).toBeDefined();
        expect(job?.name).toBe('sync:test-account-123');
        expect(job?.data).toEqual(payload);

        // Clean up the job
        if (job) {
            await job.remove();
        }
    });
});
```

---

## Verification Plan

### Automated Tests

- Command: `pnpm test tests/core/queue/__tests__/queue.service.test.ts`
  This runs the newly added integration test to verify Upstash Redis connectivity and job insertion.

### Manual Verification

- Launch backend with `pnpm dev` to check that the queues initialize correctly and connection to Upstash is successfully established.
- Run `kill -SIGINT <pid>` on the running process and check logs for proper queue and Redis teardown logs.
