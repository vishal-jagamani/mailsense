# MailSense Background Sync System - Phase 4 Implementation Plan

This plan details the implementation of the **Event Bus & Decoupled Downstream Hooks** for Phase 4 of the asynchronous synchronization pipeline.

---

## Goal Description

Establish an internal event-driven architecture to propagate sync milestones across modules cleanly. By implementing a lightweight, type-safe `EventBus` wrapper around Node's native `EventEmitter`, we decouple the core synchronization worker (`SyncWorker` / `syncAccountProcessor`) from downstream services (such as AI categorizers, search indexers, notification dispatchers, and dashboard processors).

---

## User Review Required

> [!IMPORTANT]
> **Decoupled Architecture & Safe Event Logging**
>
> 1. **In-Memory Event Delivery**: The proposed `EventBus` is an in-memory pub/sub engine using Node.js `EventEmitter`. This is suitable for standard module communication and simple dispatching. Downstream consumers will subscribe to these events and enqueue specialized, persistent BullMQ jobs (e.g., in an `ai-processing` or `notifications` queue) to prevent synchronous heap inflation or memory leakage.
> 2. **Type Safety**: Event payloads are fully defined via `SystemEventPayloads` mapping in `event.types.ts` to ensure compiler-enforced contracts.
> 3. **PII Log Sanitization**: To prevent sensitive email contents or PII (e.g., subject line, sender/receiver addresses) from leaking into logging aggregators, the `EventBus` includes a sanitization helper (`getPayloadSummary`) that filters log messages and only details system IDs and counts.

---

## Proposed Changes

### Event Bus Infrastructure

#### [NEW] [event.types.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/core/events/event.types.ts)

Declares the `SystemEvent` enum along with type-safe interface payloads for all events, ensuring typescript validation across subscribers.

#### [NEW] [event-bus.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/core/events/event-bus.ts)

Implements the singleton `EventBus` class wrapping the NodeJS `EventEmitter`, providing safe event execution blocks and PII log stripping.

#### [NEW] [index.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/core/events/index.ts)

Exposes the initialization hook (`initSystemEvents`) to bundle handler registrations and exports event properties cleanly.

---

### Downstream Stub Handlers

#### [NEW] [sync-completed.handler.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/core/events/handlers/sync-completed.handler.ts)

Standard subscriber to `SystemEvent.SYNC_COMPLETED`, stubbing out future analytics/dashboard indexing actions.

#### [NEW] [email-created.handler.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/core/events/handlers/email-created.handler.ts)

Standard subscriber to `SystemEvent.EMAIL_CREATED`, stubbing out future AI processing and real-time alert systems.

---

### Sync Pipeline Integration

#### [MODIFY] [sync-account.processor.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/workers/processors/sync-account.processor.ts)

Fires the `SystemEvent.EMAIL_CREATED` event inside both incremental and full synchronization ingestion loops for every newly indexed email.

#### [MODIFY] [sync.worker.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/workers/sync.worker.ts)

Fires the `SystemEvent.SYNC_COMPLETED` event inside the `onCompleted` lifecycle hook once all metadata checkpoints have been updated in MongoDB.

#### [MODIFY] [index.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/core/queue/index.ts)

Registers and boots system events through `initSystemEvents` inside the background jobs initialization hook (`initBackgroundJobs`).

---

### Testing

#### [NEW] [event-bus.test.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/core/events/__tests__/event-bus.test.ts)

Jest unit test suite checking subscriber triggers, type-safe execution, and handler error boundary protections.

---

## File Contents

Below are the complete file contents proposed for creation or modification.

### 1. `src/core/events/event.types.ts`

```typescript
import { EmailInput } from '@modules/emails/email.model.js';

export enum SystemEvent {
    SYNC_COMPLETED = 'sync:completed',
    EMAIL_CREATED = 'email:created',
}

export interface SyncCompletedPayload {
    accountId: string;
    addedEmailsCount: number;
    deletedEmailsCount: number;
    startedAt: number;
    completedAt: number;
}

export interface EmailCreatedPayload {
    accountId: string;
    email: EmailInput;
}

export interface SystemEventPayloads {
    [SystemEvent.SYNC_COMPLETED]: SyncCompletedPayload;
    [SystemEvent.EMAIL_CREATED]: EmailCreatedPayload;
}
```

### 2. `src/core/events/event-bus.ts`

```typescript
import { EventEmitter } from 'events';
import { logger } from '@utils';
import { SystemEvent, SystemEventPayloads } from './event.types.js';

class EventBus {
    private emitter = new EventEmitter();

    constructor() {
        // Safe limit for concurrent listeners to prevent memory warnings
        this.emitter.setMaxListeners(20);
    }

    /**
     * Publish a system event with a strongly-typed payload
     */
    public publish<K extends SystemEvent>(event: K, payload: SystemEventPayloads[K]): void {
        const summary = this.getPayloadSummary(event, payload);
        logger.info(`📢 Publishing event: ${event}`, { payload: summary });
        this.emitter.emit(event, payload);
    }

    /**
     * Subscribe to a system event with a strongly-typed payload handler
     */
    public subscribe<K extends SystemEvent>(
        event: K,
        handler: (payload: SystemEventPayloads[K]) => void | Promise<void>
    ): void {
        this.emitter.on(event, async (payload: SystemEventPayloads[K]) => {
            try {
                await handler(payload);
            } catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                logger.error(`❌ Error executing subscriber for event ${event}: ${msg}`, { error });
            }
        });
    }

    /**
     * Clear all event listeners (mainly used in testing)
     */
    public clearAllListeners(): void {
        this.emitter.removeAllListeners();
    }

    /**
     * Helper to sanitize and summarize payloads for safe logging
     */
    private getPayloadSummary(event: SystemEvent, payload: any): any {
        if (event === SystemEvent.EMAIL_CREATED) {
            return {
                accountId: payload.accountId,
                providerMessageId: payload.email.providerMessageId,
                subject: payload.email.subject,
            };
        }
        return payload;
    }
}

export const eventBus = new EventBus();
```

### 3. `src/core/events/handlers/sync-completed.handler.ts`

```typescript
import { logger } from '@utils';
import { eventBus } from '../event-bus.js';
import { SystemEvent, SyncCompletedPayload } from '../event.types.js';

export function registerSyncCompletedHandler(): void {
    eventBus.subscribe(SystemEvent.SYNC_COMPLETED, async (payload: SyncCompletedPayload) => {
        logger.info(`[Stub Subscriber] Sync Completed for account: ${payload.accountId}`, {
            addedCount: payload.addedEmailsCount,
            deletedCount: payload.deletedEmailsCount,
            durationMs: payload.completedAt - payload.startedAt,
        });

        // NOTE: Future dashboard analytics, metrics updates or reporting jobs will be enqueued here.
        // For example:
        // await QueueService.addDashboardJob({ accountId: payload.accountId });
    });
}
```

### 4. `src/core/events/handlers/email-created.handler.ts`

```typescript
import { logger } from '@utils';
import { eventBus } from '../event-bus.js';
import { SystemEvent, EmailCreatedPayload } from '../event.types.js';

export function registerEmailCreatedHandler(): void {
    eventBus.subscribe(SystemEvent.EMAIL_CREATED, async (payload: EmailCreatedPayload) => {
        logger.info(`[Stub Subscriber] New Email Synced: ${payload.email.providerMessageId} for account: ${payload.accountId}`, {
            subject: payload.email.subject,
            from: payload.email.from,
        });

        // NOTE: Future asynchronous pipelines will be triggered here.
        // For example:
        // 1. AI processing (Gemini smart categorizer, suggested replies):
        // await QueueService.addAIProcessingJob({ accountId: payload.accountId, emailId: payload.email.providerMessageId });
        //
        // 2. Notification engine:
        // await NotificationService.sendNewEmailAlert({ accountId: payload.accountId, emailId: payload.email.providerMessageId });
    });
}
```

### 5. `src/core/events/index.ts`

```typescript
import { logger } from '@utils';
import { registerSyncCompletedHandler } from './handlers/sync-completed.handler.js';
import { registerEmailCreatedHandler } from './handlers/email-created.handler.js';

export function initSystemEvents(): void {
    logger.info('🔔 Registering background system event handlers...');
    registerSyncCompletedHandler();
    registerEmailCreatedHandler();
    logger.info('🔔 System event handlers registered successfully');
}

export * from './event-bus.js';
export * from './event.types.js';
```

### 6. `src/core/events/__tests__/event-bus.test.ts`

```typescript
import { eventBus } from '../event-bus.js';
import { SystemEvent } from '../event.types.js';
import { logger } from '@utils';

jest.mock('@utils', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
    },
}));

describe('EventBus', () => {
    beforeEach(() => {
        eventBus.clearAllListeners();
        jest.clearAllMocks();
    });

    it('should successfully register a subscriber and trigger it when an event is published', async () => {
        const mockHandler = jest.fn();
        eventBus.subscribe(SystemEvent.SYNC_COMPLETED, mockHandler);

        const payload = {
            accountId: 'account-123',
            addedEmailsCount: 10,
            deletedEmailsCount: 2,
            startedAt: 1000,
            completedAt: 2500,
        };

        eventBus.publish(SystemEvent.SYNC_COMPLETED, payload);

        // Allow microtask queue to flush
        await new Promise((resolve) => setImmediate(resolve));

        expect(mockHandler).toHaveBeenCalledWith(payload);
        expect(logger.info).toHaveBeenCalledWith(
            '📢 Publishing event: sync:completed',
            expect.objectContaining({ payload })
        );
    });

    it('should handle errors thrown in event handlers without throwing inside publish', async () => {
        const error = new Error('Database connection failed inside event subscriber');
        const mockHandler = jest.fn().mockRejectedValue(error);

        eventBus.subscribe(SystemEvent.EMAIL_CREATED, mockHandler);

        const payload = {
            accountId: 'account-123',
            email: {
                accountId: 'account-123',
                providerMessageId: 'msg-abc',
                threadId: 'thread-xyz',
                from: 'test@sender.com',
                to: ['test@receiver.com'],
                cc: [],
                bcc: [],
                subject: 'Mock Subject',
                body: 'body',
                bodyHtml: '<p>body</p>',
                bodyPlain: 'body',
                receivedAt: new Date(),
                isRead: false,
                folders: ['INBOX'],
            },
        };

        // This should not throw
        expect(() => {
            eventBus.publish(SystemEvent.EMAIL_CREATED, payload);
        }).not.toThrow();

        // Allow handler promise execution
        await new Promise((resolve) => setImmediate(resolve));

        expect(mockHandler).toHaveBeenCalledWith(payload);
        expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining('❌ Error executing subscriber for event email:created'),
            expect.objectContaining({ error })
        );
    });
});
```

### 7. `src/workers/processors/sync-account.processor.ts`

```typescript
<<<<
        if (addedEmails && addedEmails.length > 0) {
            logger.info(`Upserting ${addedEmails.length} new/updated emails for account: ${accountId}`);
            await EmailRepository.upsertEmailsInBulk(addedEmails);
            addedEmailsCount = addedEmails.length;
        }

        await AccountRepository.updateAccount(accountId, {
            lastSyncedAt: Date.now(),
            lastSyncCursor: newCursor,
        });
====
        if (addedEmails && addedEmails.length > 0) {
            logger.info(`Upserting ${addedEmails.length} new/updated emails for account: ${accountId}`);
            await EmailRepository.upsertEmailsInBulk(addedEmails);
            addedEmailsCount = addedEmails.length;

            // Emit EMAIL_CREATED for each newly indexed message
            for (const email of addedEmails) {
                eventBus.publish(SystemEvent.EMAIL_CREATED, {
                    accountId,
                    email,
                });
            }
        }

        await AccountRepository.updateAccount(accountId, {
            lastSyncedAt: Date.now(),
            lastSyncCursor: newCursor,
        });
>>>>
<<<<
            if (addedEmails && addedEmails.length > 0) {
                logger.info(`Upserting ${addedEmails.length} emails after full sync for account: ${accountId}`);
                await EmailRepository.upsertEmailsInBulk(addedEmails);
                addedEmailsCount = addedEmails.length;
            }

            await AccountRepository.updateAccount(accountId, {
                lastSyncedAt: Date.now(),
                lastSyncCursor: newCursor,
            });
====
            if (addedEmails && addedEmails.length > 0) {
                logger.info(`Upserting ${addedEmails.length} emails after full sync for account: ${accountId}`);
                await EmailRepository.upsertEmailsInBulk(addedEmails);
                addedEmailsCount = addedEmails.length;

                // Emit EMAIL_CREATED for each newly indexed message
                for (const email of addedEmails) {
                    eventBus.publish(SystemEvent.EMAIL_CREATED, {
                        accountId,
                        email,
                    });
                }
            }

            await AccountRepository.updateAccount(accountId, {
                lastSyncedAt: Date.now(),
                lastSyncCursor: newCursor,
            });
>>>>
```

### 8. `src/workers/sync.worker.ts`

```typescript
<<<<
    protected async onCompleted(job: Job<SyncAccountPayload, SyncJobResult>, result: SyncJobResult): Promise<void> {
        try {
            const { accountId } = job.data;
            if (job.id) {
                await SyncJobRepository.updateSyncJob(job.id, {
                    status: ACCOUNT_SYNC_JOB_STATUS.COMPLETED,
                    completedAt: Date.now(),
                    addedEmailsCount: result?.addedEmailsCount || 0,
                    deletedEmailsCount: result?.deletedEmailsCount || 0,
                });
            }
            await AccountRepository.updateAccount(accountId, {
                syncInProgress: false,
                lastSyncStatus: ACCOUNT_LAST_SYNC_STATUS.SUCCESS,
                lastSyncCompletedAt: Date.now(),
            });
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error(`Error in SyncWorker.onCompleted: ${msg}`, { error });
        }
    }
====
    protected async onCompleted(job: Job<SyncAccountPayload, SyncJobResult>, result: SyncJobResult): Promise<void> {
        try {
            const { accountId } = job.data;
            if (job.id) {
                await SyncJobRepository.updateSyncJob(job.id, {
                    status: ACCOUNT_SYNC_JOB_STATUS.COMPLETED,
                    completedAt: Date.now(),
                    addedEmailsCount: result?.addedEmailsCount || 0,
                    deletedEmailsCount: result?.deletedEmailsCount || 0,
                });
            }
            await AccountRepository.updateAccount(accountId, {
                syncInProgress: false,
                lastSyncStatus: ACCOUNT_LAST_SYNC_STATUS.SUCCESS,
                lastSyncCompletedAt: Date.now(),
            });

            // Emit SYNC_COMPLETED event on background sync success
            eventBus.publish(SystemEvent.SYNC_COMPLETED, {
                accountId,
                addedEmailsCount: result?.addedEmailsCount || 0,
                deletedEmailsCount: result?.deletedEmailsCount || 0,
                startedAt: job.processedOn || Date.now(),
                completedAt: Date.now(),
            });
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error(`Error in SyncWorker.onCompleted: ${msg}`, { error });
        }
    }
>>>>
```

### 9. `src/core/queue/index.ts`

```typescript
<<<<
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
====
import { initSystemEvents } from 'core/events/index.js';
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

    // Initialize System Event Handlers on startup
    initSystemEvents();

    // Start background worker
    logger.info('👷 Starting Background Worker instances...');
    syncWorkerInstance = new SyncWorker();
    syncWorkerInstance.start();

    logger.info('🚀 Background Job Queues Initialized Successfully');
}
>>>>
```

---

## Verification Plan

### Automated Tests

- Execute the new unit test suite validating event bus subscriptions, routing, and error protection:
  ```bash
  NODE_ENV=local pnpm test src/core/events/__tests__/event-bus.test.ts
  ```
- Ensure type compliance:
  ```bash
  pnpm type-check
  ```

### Manual Verification

1. **Boot Logs**:
   Start the application in development mode (`pnpm dev`) and verify that logs output the setup:
   - `🔔 Registering background system event handlers...`
   - `🔔 System event handlers registered successfully`

2. **Ingestion Execution**:
   Trigger an account synchronization. Verify in the logs that:
   - For each indexed message, `[Stub Subscriber] New Email Synced: ...` matches.
   - At the completion of the ingestion loop, `[Stub Subscriber] Sync Completed for account: ...` matches.
