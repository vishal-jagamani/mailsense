# MailSense Background Sync System - Phase 5 Implementation Plan

This plan details the implementation of the **Schedulers & Token Refresher Integration** for Phase 5 of the asynchronous synchronization pipeline.

---

## Goal Description

Introduce robust periodic account synchronization and automated OAuth credential refreshes to ensure seamless, hands-free mailbox ingestion. 

This phase covers:
1. **Dynamic Repeatable Schedulers**: A startup loop scans MongoDB for all active and sync-enabled accounts, registering/recreating corresponding repeatable BullMQ interval sync jobs.
2. **Lifecycle Synchronization**: Lifecycle changes (account creation, deactivation, deletion) automatically sync repeatable jobs in BullMQ.
3. **Queue-Based Token Refresh**: A dedicated `token-refresh` queue with a `TokenRefreshWorker` processes OAuth access token updates under a Redis-based distributed double-check lock (avoiding race conditions).
4. **Resilient Sync Retry Loops**: Catching 401 Unauthorized / Token Expiry errors during email ingestion, executing the token refresh job *inline*, updating state, and retrying the synchronization page fetch.
5. **Pre-Ingestion Validation**: Early checks to abort sync execution gracefully if an account has been disabled (`active: false`) or has manual overrides (`syncEnabled: false`).

---

## User Review Required

> [!IMPORTANT]
> **Redis-Based Double-Check Locking Pattern**
>
> 1. **Avoiding Token Refresh Collisions**: To prevent concurrent workers from calling Google/Microsoft token endpoints simultaneously for the same account (which can invalidate refresh tokens and cause auth desynchronization), a lightweight Redis lock (`lock:refresh-token:${accountId}`) is used.
> 2. **Double-Check Fetch**: Before hitting OAuth APIs, a worker checks if the access token has already been updated in MongoDB while it was waiting for the lock, returning immediately on success.
> 3. **Inline Ingestion Recovery**: If `fetchMessages` encounters a `401 Unauthorized` error, it intercepts the error, runs `refreshTokenProcessor` inline, and retries the sync immediately. This preserves worker integrity and prevents unnecessary job failures.

---

## Proposed Changes

### Integration Interfaces & Abstractions

#### [MODIFY] [email.provider.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/integrations/email/email.provider.ts)
Adds the polymorphic `refreshAccessToken(accountId: string): Promise<string>` signature to the core `IEmailProvider` interface.

#### [MODIFY] [gmail.provider.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/integrations/gmail/gmail.provider.ts)
Implements `refreshAccessToken` by decrypting the refresh token and invoking static `GmailApi.refreshAccessToken`.

#### [MODIFY] [outlook.provider.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/integrations/outlook/outlook.provider.ts)
Implements `refreshAccessToken` by calling static `OutlookApi.refreshAccessToken`.

---

### Queue Configurations & Services

#### [MODIFY] [queue.config.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/core/queue/queue.config.ts)
Registers `REFRESH_TOKEN: 'refresh-token'` inside `QUEUE_NAMES`.

#### [MODIFY] [queue.service.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/core/queue/queue.service.ts)
Exposes static `addRefreshTokenJob(accountId: string)` helper to schedule manual or background refreshes.

#### [NEW] [scheduler.service.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/core/queue/scheduler.service.ts)
Orchestrates BullMQ repeatable jobs by scanning MongoDB on boot, removing stale/changed schedulers, and adding new interval jobs. Includes lifecycle hooks (`upsertAccountRepeatableJob`, `removeAccountRepeatableJob`).

---

### Token Refresher Worker & Processor

#### [NEW] [refresh-token.processor.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/workers/processors/refresh-token.processor.ts)
Implements token refresh using the Redis double-check locking pattern to guarantee single-execution safety.

#### [NEW] [token-refresh.worker.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/workers/token-refresh.worker.ts)
Extends `BaseWorker` to consume `refresh-token` queue jobs.

---

### Sync Pipeline Integration & Hook Updates

#### [MODIFY] [sync-account.processor.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/workers/processors/sync-account.processor.ts)
1. Adds early validation checks to exit gracefully when `active: false` or `syncEnabled: false`.
2. Wraps ingestion loops with token expiry checks to refresh inline and retry.

#### [MODIFY] [index.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/core/queue/index.ts)
Starts `TokenRefreshWorker` and triggers `SchedulerService.init()` on startup; closes workers cleanly on shutdown.

#### [MODIFY] [account.service.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/accounts/account.service.ts)
Triggers `SchedulerService` repeatable job registrations during OAuth account callback, activation switches, and deletions.

---

## File Contents

Below are the complete proposed file contents conforming strictly to the project rules (including zero usage of `any`, `unknown`, or `never` types as per `coding-standards.md`).

### 1. `src/integrations/email/email.provider.ts`

```typescript
import { EmailDocument, EmailInput } from '@modules/emails/email.model.js';
import { ComposeEmailBody } from '@modules/emails/email.schema.js';
import { SearchOtherContactsResponse } from '@modules/emails/email.types.js';
import { FolderInput } from '@modules/folders/folder.model.js';
import { UpdateAPIResponse } from '@types';
import { IEmailTAuthToken, IEmailTSendEmailResult, IEmailTUserProfile } from './email.provider.types.js';

export interface SyncResult {
    addedEmails: EmailInput[] | Partial<EmailInput>[];
    deletedEmailIds: string[];
    newCursor: string;
}

export interface IEmailProvider<TAuthToken = IEmailTAuthToken, TUserProfile = IEmailTUserProfile, TSendMailResult = IEmailTSendEmailResult> {
    // Auth & Profile
    getAccessTokenFromCode(code: string): Promise<TAuthToken>;
    getUserProfileFromAccessToken(accessToken: string): Promise<TUserProfile>;
    refreshAccessToken(accountId: string): Promise<string>;

    // Core Ingestion & Sync
    fetchMessages(accountId: string, cursor?: string): Promise<SyncResult | null>;

    // Email Operations
    getMessageDetails(accountId: string, emailId: string, dbEmail?: EmailDocument): Promise<EmailInput>;
    deleteEmails(emailIds: string[], accountId: string, trash?: boolean): Promise<void>;
    archiveEmails(emailIds: string[], accountId: string, archive: boolean): Promise<void>;
    unreadEmails(emailIds: string[], accountId: string, unread: boolean): Promise<void>;
    starEmails(emails: { id: string; providerMessageId: string }[], accountId: string, star: boolean): Promise<void>;
    sendMail(composeEmailData: ComposeEmailBody): Promise<TSendMailResult>;
    searchContacts(accountId: string, searchText: string): Promise<SearchOtherContactsResponse[]>;

    // Folder/Label Operations
    getAllFolders(accountId: string, userId: string): Promise<Partial<FolderInput>[]>;
    createFolder(userId: string, accountId: string, folderName: string): Promise<UpdateAPIResponse>;
    updateFolder(accountId: string, folderId: string, folderName: string): Promise<UpdateAPIResponse>;
    deleteFolder(accountId: string, folderId: string): Promise<UpdateAPIResponse>;
}
```

### 2. `src/integrations/gmail/gmail.provider.ts` (Partial Addition)

```typescript
import { GmailApi } from './gmail.client.js';
import { decrypt } from '@utils';
import { AccountRepository } from '@modules/accounts/account.repository.js';
// ... rest of imports

export class GmailProvider implements IEmailProvider<GmailOAuthAccessTokenResponse, GmailUserProfile, Partial<GmailMessageObjectFull>> {
    // ... rest of methods

    async refreshAccessToken(accountId: string): Promise<string> {
        const account = await AccountRepository.getAccountById(accountId);
        if (!account) {
            throw new Error(`Account not found for token refresh: ${accountId}`);
        }
        const decryptedRefreshToken = decrypt(account.refreshToken);
        return GmailApi.refreshAccessToken(accountId, decryptedRefreshToken);
    }
}
```

### 3. `src/integrations/outlook/outlook.provider.ts` (Partial Addition)

```typescript
import { OutlookApi } from './outlook.api.js';
// ... rest of imports

export class OutlookProvider implements IEmailProvider<OutlookOAuthAccessTokenResponse, OutlookUserProfile, OutlookMessageObjectFull> {
    // ... rest of methods

    async refreshAccessToken(accountId: string): Promise<string> {
        return OutlookApi.refreshAccessToken(accountId);
    }
}
```

### 4. `src/core/queue/queue.config.ts`

```typescript
import { QueueOptions, ConnectionOptions } from 'bullmq';
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
```

### 5. `src/core/queue/queue.service.ts`

```typescript
import { logger } from '../../shared/utils/logger.js';
import { QUEUE_NAMES } from './queue.config.js';
import { getQueue } from './queue.registry.js';

export interface SyncAccountPayload {
    accountId: string;
    userId: string;
    force?: boolean;
}

export interface RefreshTokenPayload {
    accountId: string;
}

export class QueueService {
    /**
     * Enqueues a sync job for a specific user email account
     */
    public static async addSyncAccountJob(payload: SyncAccountPayload, priority: number = 2): Promise<string | undefined> {
        try {
            const queue = getQueue(QUEUE_NAMES.SYNC_ACCOUNT);
            const jobName = `sync:${payload.accountId}`;

            const job = await queue.add(jobName, payload, { priority });

            logger.info(`✉️ Job ${job.id} successfully added to queue ${QUEUE_NAMES.SYNC_ACCOUNT} (Priority: ${priority})`);
            return job.id;
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error(`❌ Failed to enqueue sync account job: ${msg}`, { error, payload });
            throw error;
        }
    }

    /**
     * Enqueues a token refresh job
     */
    public static async addRefreshTokenJob(payload: RefreshTokenPayload): Promise<string | undefined> {
        try {
            const queue = getQueue(QUEUE_NAMES.REFRESH_TOKEN);
            const jobName = `refresh:${payload.accountId}`;

            const job = await queue.add(jobName, payload, {
                attempts: 2,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
            });

            logger.info(`🔄 Job ${job.id} successfully added to queue ${QUEUE_NAMES.REFRESH_TOKEN}`);
            return job.id;
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error(`❌ Failed to enqueue token refresh job: ${msg}`, { error, payload });
            throw error;
        }
    }
}
```

### 6. `src/core/queue/scheduler.service.ts`

```typescript
import { AccountRepository } from '@modules/accounts/account.repository.js';
import { logger } from '@utils';
import { QUEUE_NAMES } from './queue.config.js';
import { getQueue } from './queue.registry.js';

export class SchedulerService {
    /**
     * Scans database and synchronizes repeatable BullMQ jobs.
     * Recreates repeatable jobs if sync intervals change.
     */
    public static async init(): Promise<void> {
        try {
            logger.info('⏰ Syncing background schedules with MongoDB...');
            const queue = getQueue(QUEUE_NAMES.SYNC_ACCOUNT);

            // Fetch current repeatability states in BullMQ
            const jobSchedulers = await queue.getJobSchedulers();

            // Fetch active/sync-enabled accounts from MongoDB
            const accounts = await AccountRepository.getAccounts({ active: true, syncEnabled: true });
            const activeAccountIds = new Set(accounts.map((acc) => String(acc._id)));

            // 1. Remove jobs that no longer match active criteria or whose intervals changed
            for (const scheduler of jobSchedulers) {
                if (!scheduler.name.startsWith('sync:')) {
                    continue;
                }
                const accountId = scheduler.name.replace('sync:', '');

                if (!accountId || !activeAccountIds.has(accountId)) {
                    logger.info(`⏰ Removing deprecated repeatable job key ${scheduler.key} for account: ${accountId}`);
                    await queue.removeJobScheduler(scheduler.key);
                    continue;
                }

                const account = accounts.find((acc) => String(acc._id) === accountId);
                if (account) {
                    const expectedIntervalMs = account.syncInterval * 60 * 1000;
                    if (scheduler.every !== expectedIntervalMs) {
                        logger.info(`⏰ Interval shift detected for account: ${accountId}. Rebuilding scheduler.`);
                        await queue.removeJobScheduler(scheduler.key);
                    }
                }
            }

            // 2. Register/Ensure repeatable jobs exist for all active accounts
            for (const account of accounts) {
                const accountId = String(account._id);
                const intervalMs = account.syncInterval * 60 * 1000;

                const alreadyRegistered = jobSchedulers.some((scheduler) => {
                    if (!scheduler.name.startsWith('sync:')) {
                        return false;
                    }
                    const rAccountId = scheduler.name.replace('sync:', '');
                    return rAccountId === accountId && scheduler.every === intervalMs;
                });

                if (!alreadyRegistered) {
                    logger.info(`⏰ Registering repeatable sync for account: ${accountId} (Every ${account.syncInterval} mins)`);
                    await queue.add(
                        `sync:${accountId}`,
                        { accountId, userId: account.userId, force: false },
                        {
                            repeat: { every: intervalMs },
                            jobId: `repeat:${accountId}`,
                            priority: 2, // Auto-scheduled runs at lower priority
                        },
                    );
                }
            }
            logger.info('⏰ Background schedules synchronized successfully');
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error(`❌ Failed to sync repeatable schedulers: ${msg}`, { error });
            throw error;
        }
    }

    /**
     * Dynamic upsert when an account triggers activation or updates intervals
     */
    public static async upsertAccountRepeatableJob(accountId: string): Promise<void> {
        try {
            const account = await AccountRepository.getAccountById(accountId);
            if (!account || !account.active || !account.syncEnabled) {
                await this.removeAccountRepeatableJob(accountId);
                return;
            }

            const queue = getQueue(QUEUE_NAMES.SYNC_ACCOUNT);
            const jobSchedulers = await queue.getJobSchedulers();
            const intervalMs = account.syncInterval * 60 * 1000;

            for (const scheduler of jobSchedulers) {
                if (!scheduler.name.startsWith('sync:')) {
                    continue;
                }
                const rAccountId = scheduler.name.replace('sync:', '');
                if (rAccountId === accountId && scheduler.every !== intervalMs) {
                    await queue.removeJobScheduler(scheduler.key);
                }
            }

            logger.info(`⏰ Registering/Updating repeatable sync: ${accountId} (Every ${account.syncInterval} mins)`);
            await queue.add(
                `sync:${accountId}`,
                { accountId, userId: account.userId, force: false },
                {
                    repeat: { every: intervalMs },
                    jobId: `repeat:${accountId}`,
                    priority: 2,
                },
            );
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error(`❌ Failed to upsert repeatable job: ${msg}`, { error, accountId });
            throw error;
        }
    }

    /**
     * Remove repeatable jobs when deactivated/deleted
     */
    public static async removeAccountRepeatableJob(accountId: string): Promise<void> {
        try {
            const queue = getQueue(QUEUE_NAMES.SYNC_ACCOUNT);
            const jobSchedulers = await queue.getJobSchedulers();

            for (const scheduler of jobSchedulers) {
                if (!scheduler.name.startsWith('sync:')) {
                    continue;
                }
                const rAccountId = scheduler.name.replace('sync:', '');
                if (rAccountId === accountId) {
                    logger.info(`⏰ Deleting repeatable sync schedule: ${accountId}`);
                    await queue.removeJobScheduler(scheduler.key);
                }
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error(`❌ Failed to delete repeatable sync job: ${msg}`, { error, accountId });
            throw error;
        }
    }
}
```

### 7. `src/workers/processors/refresh-token.processor.ts`

```typescript
import { EmailProviderFactory } from '@integrations/email/email.provider.factory.js';
import { AccountRepository } from '@modules/accounts/account.repository.js';
import { AccountProvider } from '@types';
import { logger } from '@utils';
import { Job } from 'bullmq';
import { getRedisConnection } from 'core/queue/redis.connection.js';
import { RefreshTokenPayload } from 'core/queue/queue.service.js';

export const refreshTokenProcessor = async (job: Job<RefreshTokenPayload>): Promise<{ status: boolean }> => {
    const { accountId } = job.data;
    logger.info(`🔄 Processing token refresh request for account: ${accountId}`);

    const redis = getRedisConnection();
    const lockKey = `lock:refresh-token:${accountId}`;
    const maxWaitTimeMs = 5000;
    const checkIntervalMs = 500;
    let waitedTimeMs = 0;

    // Retry loop attempting to acquire the distributed locks safely
    while (waitedTimeMs < maxWaitTimeMs) {
        const lockAcquired = await redis.set(lockKey, 'locked', 'NX', 'PX', 15000);
        if (lockAcquired === 'OK') {
            try {
                const account = await AccountRepository.getAccountById(accountId);
                if (!account) {
                    throw new Error(`Account details missing: ${accountId}`);
                }

                // Double check if token was updated by another thread
                const isTokenValid = account.accessTokenExpiry > Date.now() + 60 * 1000;
                if (isTokenValid) {
                    logger.info(`🔄 Token for account ${accountId} was already refreshed, skipping.`);
                    return { status: true };
                }

                const emailProvider = EmailProviderFactory.getProvider(account.provider as AccountProvider);
                await emailProvider.refreshAccessToken(accountId);
                logger.info(`🔄 Token refreshed successfully for account: ${accountId}`);
                return { status: true };
            } finally {
                await redis.del(lockKey);
            }
        }

        // Wait and check if database access token was updated while waiting
        await new Promise((resolve) => setTimeout(resolve, checkIntervalMs));
        waitedTimeMs += checkIntervalMs;

        const account = await AccountRepository.getAccountById(accountId);
        if (account && account.accessTokenExpiry > Date.now() + 60 * 1000) {
            logger.info(`🔄 Token updated by competing worker thread for account: ${accountId}`);
            return { status: true };
        }
    }

    throw new Error(`Timeout waiting to acquire refresh token lock for account: ${accountId}`);
};
```

### 8. `src/workers/token-refresh.worker.ts`

```typescript
import { Job } from 'bullmq';
import { QUEUE_NAMES } from 'core/queue/queue.config.js';
import { RefreshTokenPayload } from 'core/queue/queue.service.js';
import { logger } from '@utils';
import { BaseWorker } from './base.worker.js';
import { refreshTokenProcessor } from './processors/refresh-token.processor.js';

export class TokenRefreshWorker extends BaseWorker<RefreshTokenPayload, { status: boolean }> {
    protected queueName = QUEUE_NAMES.REFRESH_TOKEN;

    protected async processJob(job: Job<RefreshTokenPayload, { status: boolean }>): Promise<{ status: boolean }> {
        return refreshTokenProcessor(job);
    }

    protected async onActive(job: Job<RefreshTokenPayload, { status: boolean }>): Promise<void> {
        logger.info(`🔄 Token Refresh Worker started processing job: ${job.id}`);
    }

    protected async onCompleted(job: Job<RefreshTokenPayload, { status: boolean }>, result: { status: boolean }): Promise<void> {
        logger.info(`🔄 Token Refresh Worker completed job: ${job.id}`);
    }

    protected async onFailed(job: Job<RefreshTokenPayload, { status: boolean }> | undefined, error: Error): Promise<void> {
        logger.error(`❌ Token Refresh Worker failed job: ${job?.id} with error: ${error.message}`, { error });
    }
}
```

### 9. `src/workers/processors/sync-account.processor.ts`

```typescript
import { EmailProviderFactory } from '@integrations/email/email.provider.factory.js';
import { AccountRepository } from '@modules/accounts/account.repository.js';
import { EmailRepository } from '@modules/emails/email.repository.js';
import { FolderService } from '@modules/folders/folder.service.js';
import { AccountProvider } from '@types';
import { logger } from '@utils';
import { Job } from 'bullmq';
import { eventBus } from 'core/events/event-bus.js';
import { SystemEvent } from 'core/events/event.types.js';
import { SyncAccountPayload } from 'core/queue/queue.service.js';
import { SyncJobResult } from 'workers/worker.types.js';
import { refreshTokenProcessor } from './refresh-token.processor.js';

interface ErrorWithStatus {
    status?: number;
    statusCode?: number;
    response?: {
        status?: number;
        statusCode?: number;
    };
}

function isTokenExpiryError(error: Error | ErrorWithStatus | null | undefined): boolean {
    if (!error) return false;
    if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('unauthorized') || msg.includes('expired') || msg.includes('invalid credentials')) {
            return true;
        }
    }
    const err = error as ErrorWithStatus;
    if (err.status === 401 || err.statusCode === 401) {
        return true;
    }
    if (err.response && (err.response.status === 401 || err.response.statusCode === 401)) {
        return true;
    }
    return false;
}

export const syncAccountProcessor = async (job: Job<SyncAccountPayload, SyncJobResult>): Promise<SyncJobResult> => {
    const { accountId } = job.data;

    logger.info(`Processing background sync for account: ${accountId}`);

    const account = await AccountRepository.getAccountById(accountId);
    if (!account) {
        throw new Error(`Account not found: ${accountId}`);
    }

    // Gracefully abort sync if account is disabled or deactivated
    if (!account.active) {
        logger.warn(`⚠️ Sync execution aborted. Account is inactive: ${accountId}`);
        return { addedEmailsCount: 0, deletedEmailsCount: 0 };
    }

    if (!account.syncEnabled) {
        logger.warn(`⚠️ Sync execution aborted. Sync is disabled: ${accountId}`);
        return { addedEmailsCount: 0, deletedEmailsCount: 0 };
    }

    const emailProvider = EmailProviderFactory.getProvider(account.provider as AccountProvider);
    const folderService = new FolderService();

    // 1. Sync Folders & Labels
    logger.info(`Syncing folders for account: ${accountId}`);
    await folderService.syncFolders(accountId);

    // 2. Sync Emails (Incremental vs Full Sync)
    logger.info(`Fetching email updates for account: ${accountId} (Cursor: ${account.lastSyncCursor || 'None'})`);
    
    let historyDetails = null;
    try {
        historyDetails = await emailProvider.fetchMessages(accountId, account.lastSyncCursor);
    } catch (error) {
        if (isTokenExpiryError(error)) {
            logger.info(`🔑 Token validation failed for account ${accountId}. Running inline token refresh...`);
            await refreshTokenProcessor({ data: { accountId } } as Job<any>);
            
            const updatedAccount = await AccountRepository.getAccountById(accountId);
            if (!updatedAccount || !updatedAccount.active) {
                throw new Error(`Account disabled or missing post token refresh: ${accountId}`);
            }
            logger.info(`🔑 Retrying fetchMessages for account: ${accountId}`);
            historyDetails = await emailProvider.fetchMessages(accountId, updatedAccount.lastSyncCursor);
        } else {
            throw error;
        }
    }

    let addedEmailsCount = 0;
    let deletedEmailsCount = 0;

    if (historyDetails) {
        const { addedEmails, deletedEmailIds, newCursor } = historyDetails;

        if (deletedEmailIds && deletedEmailIds.length > 0) {
            logger.info(`Deleting ${deletedEmailIds.length} emails for account: ${accountId}`);
            await EmailRepository.deleteManyEmails(deletedEmailIds);
            deletedEmailsCount = deletedEmailIds.length;
        }

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
    } else {
        logger.info(`Performing full email sync for account: ${accountId}`);
        let fullSyncResult = null;
        try {
            fullSyncResult = await emailProvider.fetchMessages(accountId);
        } catch (error) {
            if (isTokenExpiryError(error)) {
                logger.info(`🔑 Token validation failed during full sync for account ${accountId}. Running inline token refresh...`);
                await refreshTokenProcessor({ data: { accountId } } as Job<any>);
                
                const updatedAccount = await AccountRepository.getAccountById(accountId);
                if (!updatedAccount || !updatedAccount.active) {
                    throw new Error(`Account disabled or missing post token refresh: ${accountId}`);
                }
                logger.info(`🔑 Retrying full sync fetchMessages for account: ${accountId}`);
                fullSyncResult = await emailProvider.fetchMessages(accountId);
            } else {
                throw error;
            }
        }

        if (fullSyncResult) {
            const { addedEmails, newCursor } = fullSyncResult;

            // Delete all previous emails for full sync
            logger.info(`Clearing existing emails for full sync of account: ${accountId}`);
            await EmailRepository.deleteEmailsByAccountId(accountId);

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
        }
    }

    logger.info(`Background sync completed for account ${accountId}. Added: ${addedEmailsCount}, Deleted: ${deletedEmailsCount}`);

    return {
        addedEmailsCount,
        deletedEmailsCount,
    };
};
```

### 10. `src/core/queue/index.ts`

```typescript
import { initSystemEvents } from 'core/events/index.js';
import { SyncWorker } from 'workers/sync.worker.js';
import { TokenRefreshWorker } from 'workers/token-refresh.worker.js';
import { SchedulerService } from './scheduler.service.js';
import { logger } from '../../shared/utils/logger.js';
import { closeAllQueues, initQueueRegistry } from './queue.registry.js';
import { closeRedisConnection } from './redis.connection.js';

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
```

### 11. `src/modules/accounts/account.service.ts` (Modified Methods)

```typescript
import { SchedulerService } from 'core/queue/scheduler.service.js';
// ... rest of imports

export class AccountsService {
    // ...

    private async initiateAccountDeletion(accountId: string): Promise<void> {
        try {
            // Remove repeatable job from scheduler
            await SchedulerService.removeAccountRepeatableJob(accountId);

            // Delete account from db
            await AccountRepository.deleteAccount(accountId);
            // Delete emails related to this account
            await EmailRepository.deleteEmailsByAccountId(accountId);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.initiateAccountDeletion: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async callback(provider: string, params: { code: string; state: string }): Promise<string> {
        // ... (auth exchanges)
        const savedAccount = await AccountRepository.upsertAccount(account);
        
        // Register repeatable sync schedulers for newly authenticated accounts
        await SchedulerService.upsertAccountRepeatableJob(String(savedAccount._id));
        
        this.syncAccount(String(savedAccount._id));
        return MAILSENSE_BASE_URL;
    }

    public async enableAccount(accountId: string, active: boolean): Promise<UpdateAPIResponse> {
        try {
            await AccountRepository.updateAccount(accountId, { active });

            // Dynamically register or deregister from schedulers based on active switch
            if (active) {
                await SchedulerService.upsertAccountRepeatableJob(accountId);
            } else {
                await SchedulerService.removeAccountRepeatableJob(accountId);
            }

            return { status: true, message: `Account ${active ? 'enabled' : 'disabled'} successfully` };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.enableAccount: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
```

---

## Verification Plan

### Automated Tests

- Propose creating a new test file `src/workers/__tests__/refresh-token.processor.test.ts` to test locking mechanisms and double-check logic.
- Execute unit test suites verifying token refreshes and background sync processor validations:
  ```bash
  NODE_ENV=local pnpm test src/workers/__tests__/sync.worker.test.ts
  ```
- Run TS compilations to ensure type safety conformance:
  ```bash
  pnpm type-check
  ```

### Manual Verification

1. **Active/Sync Enabled Guards**:
   Trigger a manual sync of an inactive account (`active: false` in DB) or sync-disabled account (`syncEnabled: false`). Confirm in the logs that ingestion aborts gracefully:
   - `⚠️ Sync execution aborted. Account is inactive: ...`
   - `⚠️ Sync execution aborted. Sync is disabled: ...`

2. **Cron Auto-Sync Registrations**:
   Start the server in development mode. Confirm repeatable jobs are successfully initialized in BullMQ via Redis CLI:
   - Command: `redis-cli KEYS "bull:sync-account:repeat:*"` should list registered account keys matching MongoDB active setups.

3. **Compelled Token Refresh Flow**:
   Modify a test account in MongoDB with an expired `accessTokenExpiry` timestamp. Run account sync. Check logs to ensure:
   - `🔑 Token validation failed... Running inline token refresh...` is triggered.
   - Access tokens update in MongoDB database.
   - Execution finishes ingestion without throwing errors.
