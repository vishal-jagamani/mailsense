# MailSense Background Sync System - Phase 3 Implementation Plan

This plan details the implementation of the **Workers and Sync Pipeline Rollout** for Phase 3 of the asynchronous synchronization pipeline.

---

## Goal Description

Introduce background processing worker infrastructure (`BaseWorker` and `SyncWorker`), implement a detailed job tracking model (`SyncJob`), update Mongoose schemas for accounts to track sync states, and refactor the account sync API endpoints to trigger background jobs and return `202 Accepted` immediately.

---

## User Review Required

> [!IMPORTANT]
> **API Sync Endpoint Transition to Async (202 Accepted)**
>
> Previously, the `/api/accounts/sync/:accountId` and `/api/accounts/sync-all` endpoints performed synchronization synchronously or triggered dangling, un-tracked background promises. Under the new architecture:
>
> * The controller returns a **`202 Accepted`** response immediately, accompanied by the generated BullMQ `jobId` / `jobIds`.
> * Every background sync registers a **`SyncJob`** database audit entry (with a status of `PENDING`, `RUNNING`, `COMPLETED`, or `FAILED`) to keep execution history transparent and queryable.
> * Account database documents store sync states (`syncInProgress`, `lastSyncStatus`, `lastSyncError`, `lastSyncStartedAt`, `lastSyncCompletedAt`) to allow the UI to display spinner states, error messages, and sync checkpoints dynamically.

---

## Proposed Changes

### Worker Infrastructure

#### [NEW] [base.worker.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/workers/base.worker.ts)

A base generic worker wrapping BullMQ `Worker`, implementing standard lifecycle events (`active`, `completed`, `failed`), setting up default concurrency (concurrency level `2` for hosting constraints), and handling graceful shutdowns.

#### [NEW] [sync.worker.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/workers/sync.worker.ts)

Concrete implementation of the sync worker executing `syncAccountProcessor` and updating database schemas (`SyncJob` and `Account`) during lifecycle hooks.

#### [NEW] [sync-account.processor.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/workers/processors/sync-account.processor.ts)

A standalone processor function that coordinates folder/label updates and performs either incremental history/delta sync or fallbacks to full email ingestion depending on the presence of a cursor.

---

### Database & Repositories

#### [MODIFY] [account.types.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/accounts/account.types.ts)

Extends `AccountAttributes` type definition to include state tracking attributes.

#### [MODIFY] [account.model.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/accounts/account.model.ts)

Modifies Mongoose `AccountSchema` to index and store background sync tracking fields.

#### [NEW] [sync-job.model.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/accounts/sync-job.model.ts)

Declares the Mongoose schema and types for `SyncJob` to persist background execution histories.

#### [NEW] [sync-job.repository.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/accounts/sync-job.repository.ts)

Implements static methods for creating, updating, and querying `SyncJob` records.

---

### Core Queue & Bootstrapping Hook

#### [MODIFY] [index.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/core/queue/index.ts)

Instantiates and starts the `SyncWorker` on server boot (`initBackgroundJobs`) and stops it cleanly during SIGINT/SIGTERM (`shutdownBackgroundJobs`).

#### [MODIFY] [account.controller.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/accounts/account.controller.ts)

Refactors the controllers to await the service enqueuing response and return a `202 Accepted` response.

#### [MODIFY] [account.service.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/accounts/account.service.ts)

Removes synchronous email processing details to the background worker/processor. Resolves manual sync requests by creating a `SyncJob` document and queuing a high priority (Priority 1) BullMQ task.

---

### Testing

#### [NEW] [sync.worker.test.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/workers/__tests__/sync.worker.test.ts)

A mock-based Jest test suite validating incremental sync, full sync fallback, repository updates, and error boundary handling.

---

## File Contents

Below are the complete file contents proposed for creation or modification.

### 1. `src/modules/accounts/account.types.ts`

```typescript
import { EmailInput } from '@modules/emails/email.model.js';
import { GmailUserProfile } from 'integrations/gmail/gmail.types.js';
import { OutlookUserProfile } from 'integrations/outlook/outlook.types.js';
import { Types, ProjectionType } from 'mongoose';
import { AccountDocument } from './account.model.js';

export enum ACCOUNT_LAST_SYNC_STATUS {
    PENDING = 'PENDING',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
}

// Model types
export interface AccountAttributes {
    id: number;
    userId: string;
    provider: string;
    emailAddress: string;
    userProfileDetails: GmailUserProfile | OutlookUserProfile;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiry: number;
    refreshTokenExpiry: number;
    scope: string;
    syncEnabled: boolean;
    syncInterval: number;
    lastSyncedAt: number;
    lastSyncCursor: string;
    active: boolean;
    syncInProgress: boolean;
    lastSyncStatus?: ACCOUNT_LAST_SYNC_STATUS;
    lastSyncError?: string;
    lastSyncStartedAt?: number;
    lastSyncCompletedAt?: number;
}

export interface AccountMetricsAttributes {
    accountId: string;
    totalEmails: number;
    totalThreads: number;
    totalLabels: number;
    totalFolders: number;
    totalContacts: number;
    date: Date;
}

// DB Field Mapping
export interface AccountFetchAccessTokenDBMapping {
    FETCH_ACCESS_TOKEN: { projection: ProjectionType<AccountDocument> };
}

export interface GetAccountEmailsResponse {
    emails: EmailInput[];
    lastSyncCursor: string;
}

export enum ACCOUNT_SYNC_JOB_STATUS {
    PENDING = 'PENDING',
    RUNNING = 'RUNNING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export enum ACCOUNT_SYNC_JOB_TRIGGER_TYPE {
    MANUAL = 'MANUAL',
    SCHEDULED = 'SCHEDULED',
}

export interface SyncJobAttributes {
    accountId: Types.ObjectId;
    bullJobId: string;
    status: ACCOUNT_SYNC_JOB_STATUS;
    triggerType: ACCOUNT_SYNC_JOB_TRIGGER_TYPE;
    startedAt: number;
    completedAt?: number;
    addedEmailsCount: number;
    deletedEmailsCount: number;
    errorMessage?: string;
    errorStack?: string;
}
```

### 2. `src/modules/accounts/account.model.ts`

```typescript
import { Document, model, Schema } from 'mongoose';
import validator from 'validator';
import { AccountAttributes, AccountMetricsAttributes, ACCOUNT_LAST_SYNC_STATUS } from './account.types.js';

// ✅ Input type (plain object you pass into create)
export type AccountInput = Omit<AccountAttributes, 'createdAt' | 'updatedAt'>;
export type AccountMetricsInput = Omit<AccountMetricsAttributes, 'createdAt' | 'updatedAt'>;

// ✅ Document type (what comes back from Mongo)
export type AccountDocument = Document & AccountAttributes;
export type AccountMetricsDocument = Document & AccountMetricsAttributes;

const AccountSchema = new Schema<AccountDocument>(
    {
        id: { type: Number, required: true, unique: true },
        userId: { type: String, required: true },
        provider: { type: String, required: true },
        emailAddress: { type: String, required: true },
        userProfileDetails: { type: Object, required: true },
        accessToken: { type: String, required: true },
        refreshToken: { type: String, required: true },
        accessTokenExpiry: { type: Number, required: true },
        refreshTokenExpiry: { type: Number, required: true },
        scope: { type: String, required: true },
        syncEnabled: { type: Boolean, required: true },
        syncInterval: { type: Number, required: true },
        lastSyncedAt: { type: Number, required: true },
        lastSyncCursor: { type: String, required: false },
        active: { type: Boolean, required: true },
        syncInProgress: { type: Boolean, default: false },
        lastSyncStatus: { type: String, enum: Object.values(ACCOUNT_LAST_SYNC_STATUS), required: false },
        lastSyncError: { type: String, required: false },
        lastSyncStartedAt: { type: Number, required: false },
        lastSyncCompletedAt: { type: Number, required: false },
    },
    { timestamps: true, versionKey: false },
);

// Indexes
AccountSchema.index({ emailAddress: 1 }, { unique: true });
AccountSchema.index({ userId: 1 });
AccountSchema.index({ active: 1 });

// ✅ Pre-save hook
AccountSchema.pre('save', function (next) {
    if (this.emailAddress) {
        this.emailAddress = this.emailAddress.trim().toLowerCase();
    }
    if (!validator.isEmail(this.emailAddress)) {
        return next(new Error('Invalid email format'));
    }
    next();
});

export const Account = model<AccountDocument>('Account', AccountSchema);

const AccountMetricsSchema = new Schema<AccountMetricsDocument>(
    {
        accountId: { type: String, required: true },
        totalEmails: { type: Number, required: true },
        totalThreads: { type: Number, required: true },
        totalLabels: { type: Number, required: true },
        totalFolders: { type: Number, required: true },
        totalContacts: { type: Number, required: true },
        date: { type: Date, required: true },
    },
    { timestamps: true, versionKey: false },
);

// Indexes
AccountMetricsSchema.index({ accountId: 1 }, { unique: true });

export const AccountMetrics = model<AccountMetricsDocument>('AccountMetrics', AccountMetricsSchema);
```

### 3. `src/modules/accounts/sync-job.model.ts`

```typescript
import { Document, model, Schema } from 'mongoose';
import { ACCOUNT_SYNC_JOB_STATUS, ACCOUNT_SYNC_JOB_TRIGGER_TYPE, SyncJobAttributes } from './account.types.js';

export type SyncJobInput = Omit<SyncJobAttributes, 'createdAt' | 'updatedAt'>;
export type SyncJobDocument = Document & SyncJobAttributes;

const SyncJobSchema = new Schema<SyncJobDocument>(
    {
        accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
        bullJobId: { type: String, required: true, unique: true, index: true },
        status: {
            type: String,
            enum: Object.values(ACCOUNT_SYNC_JOB_STATUS),
            default: ACCOUNT_SYNC_JOB_STATUS.PENDING,
            index: true,
        },
        triggerType: {
            type: String,
            enum: Object.values(ACCOUNT_SYNC_JOB_TRIGGER_TYPE),
            required: true,
        },
        startedAt: { type: Number, required: true },
        completedAt: { type: Number, required: false },
        addedEmailsCount: { type: Number, default: 0 },
        deletedEmailsCount: { type: Number, default: 0 },
        errorMessage: { type: String, required: false },
        errorStack: { type: String, required: false },
    },
    { timestamps: true, versionKey: false },
);

export const SyncJob = model<SyncJobDocument>('SyncJob', SyncJobSchema);
```

### 4. `src/modules/accounts/sync-job.repository.ts`

```typescript
import { SyncJob, SyncJobDocument, SyncJobInput } from './sync-job.model.js';

export class SyncJobRepository {
    public static async createSyncJob(data: Partial<SyncJobInput>): Promise<SyncJobDocument> {
        return SyncJob.create(data);
    }

    public static async updateSyncJob(bullJobId: string, data: Partial<SyncJobInput>): Promise<SyncJobDocument | null> {
        return SyncJob.findOneAndUpdate({ bullJobId }, data, { new: true });
    }

    public static async getSyncJobByBullId(bullJobId: string): Promise<SyncJobDocument | null> {
        return SyncJob.findOne({ bullJobId });
    }

    public static async getLatestSyncJobForAccount(accountId: string): Promise<SyncJobDocument | null> {
        return SyncJob.findOne({ accountId }).sort({ startedAt: -1 });
    }
}
```

### 5. `src/workers/base.worker.ts`

```typescript
import { logger } from '@utils';
import { Job, Worker, WorkerOptions } from 'bullmq';
import { getRedisConnection } from 'core/queue/redis.connection.js';

export abstract class BaseWorker<TData, TResult> {
    protected worker!: Worker<TData, TResult>;
    protected abstract queueName: string;
    protected abstract processJob(job: Job<TData, TResult>): Promise<TResult>;

    public start(): void {
        const connection = getRedisConnection();

        const workerOptions: WorkerOptions = {
            connection,
            concurrency: 2, // Safe concurrency limit for low memory container (256MB RAM)
        };

        this.worker = new Worker<TData, TResult>(
            this.queueName,
            async (job) => {
                logger.info(`🚀 Starting job ${job.id} [${job.name}] on queue ${this.queueName}`);
                try {
                    return await this.processJob(job);
                } catch (error) {
                    const msg = error instanceof Error ? error.message : String(error);
                    logger.error(`❌ Job ${job.id} failed in processor: ${msg}`, { error, jobId: job.id });
                    throw error;
                }
            },
            workerOptions,
        );

        this.worker.on('active', (job) => {
            logger.info(`🏃 Job ${job.id} is now active`);
            this.onActive(job);
        });

        this.worker.on('completed', (job, result) => {
            logger.info(`✅ Job ${job.id} completed successfully`);
            this.onCompleted(job, result);
        });

        this.worker.on('failed', (job, error) => {
            logger.error(`❌ Job ${job?.id} failed with error: ${error.message}`, { error });
            this.onFailed(job, error);
        });

        logger.info(`👷 Worker started for queue: ${this.queueName}`);
    }

    public async shutdown(): Promise<void> {
        if (this.worker) {
            await this.worker.close();
            logger.info(`✅ Worker for queue ${this.queueName} closed`);
        }
    }

    protected abstract onActive(job: Job<TData, TResult>): void | Promise<void>;
    protected abstract onCompleted(job: Job<TData, TResult>, result: TResult): void | Promise<void>;
    protected abstract onFailed(job: Job<TData, TResult> | undefined, error: Error): void | Promise<void>;
}
```

### 6. `src/workers/sync.worker.ts`

```typescript
import { Job } from 'bullmq';
import { BaseWorker } from './base.worker.js';
import { QUEUE_NAMES } from '../core/queue/queue.config.js';
import { SyncJobRepository } from '../modules/accounts/sync-job.repository.js';
import { AccountRepository } from '../modules/accounts/account.repository.js';
import { logger } from '../shared/utils/logger.js';
import { syncAccountProcessor } from './processors/sync-account.processor.js';
import { SyncAccountPayload } from '../core/queue/queue.service.js';

export interface SyncJobResult {
    addedEmailsCount: number;
    deletedEmailsCount: number;
}

export class SyncWorker extends BaseWorker<SyncAccountPayload, SyncJobResult> {
    protected queueName = QUEUE_NAMES.SYNC_ACCOUNT;

    protected async processJob(job: Job<SyncAccountPayload, SyncJobResult>): Promise<SyncJobResult> {
        return syncAccountProcessor(job);
    }

    protected async onActive(job: Job<SyncAccountPayload, SyncJobResult>): Promise<void> {
        try {
            const { accountId } = job.data;
            if (job.id) {
                await SyncJobRepository.updateSyncJob(job.id, {
                    status: 'RUNNING',
                    startedAt: Date.now(),
                });
            }
            await AccountRepository.updateAccount(accountId, {
                syncInProgress: true,
                lastSyncStatus: 'PENDING',
                lastSyncStartedAt: Date.now(),
            });
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error(`Error in SyncWorker.onActive: ${msg}`, { error });
        }
    }

    protected async onCompleted(job: Job<SyncAccountPayload, SyncJobResult>, result: SyncJobResult): Promise<void> {
        try {
            const { accountId } = job.data;
            if (job.id) {
                await SyncJobRepository.updateSyncJob(job.id, {
                    status: 'COMPLETED',
                    completedAt: Date.now(),
                    addedEmailsCount: result?.addedEmailsCount || 0,
                    deletedEmailsCount: result?.deletedEmailsCount || 0,
                });
            }
            await AccountRepository.updateAccount(accountId, {
                syncInProgress: false,
                lastSyncStatus: 'SUCCESS',
                lastSyncCompletedAt: Date.now(),
            });
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error(`Error in SyncWorker.onCompleted: ${msg}`, { error });
        }
    }

    protected async onFailed(job: Job<SyncAccountPayload, SyncJobResult> | undefined, error: Error): Promise<void> {
        try {
            if (!job) return;
            const { accountId } = job.data;
            if (job.id) {
                await SyncJobRepository.updateSyncJob(job.id, {
                    status: 'FAILED',
                    completedAt: Date.now(),
                    errorMessage: error.message,
                    errorStack: error.stack,
                });
            }
            await AccountRepository.updateAccount(accountId, {
                syncInProgress: false,
                lastSyncStatus: 'FAILED',
                lastSyncError: error.message,
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            logger.error(`Error in SyncWorker.onFailed: ${msg}`, { error: err });
        }
    }
}
```

### 7. `src/workers/processors/sync-account.processor.ts`

```typescript
import { Job } from 'bullmq';
import { AccountRepository } from '../../modules/accounts/account.repository.js';
import { EmailRepository } from '../../modules/emails/email.repository.js';
import { FolderService } from '../../modules/folders/folder.service.js';
import { EmailProviderFactory } from '../../integrations/email/email.provider.factory.js';
import { AccountProvider } from '../../core/types/index.js';
import { logger } from '../../shared/utils/logger.js';
import { SyncJobResult } from '../sync.worker.js';
import { SyncAccountPayload } from '../../core/queue/queue.service.js';

export async function syncAccountProcessor(job: Job<SyncAccountPayload, SyncJobResult>): Promise<SyncJobResult> {
    const { accountId } = job.data;
    logger.info(`Processing background sync for account: ${accountId}`);

    const account = await AccountRepository.getAccountById(accountId);
    if (!account) {
        throw new Error(`Account not found: ${accountId}`);
    }

    if (!account.active) {
        throw new Error(`Account is inactive: ${accountId}`);
    }

    const emailProvider = EmailProviderFactory.getProvider(account.provider as AccountProvider);
    const folderService = new FolderService();

    // 1. Sync Folders & Labels
    logger.info(`Syncing folders for account: ${accountId}`);
    await folderService.syncFolders(accountId);

    // 2. Sync Emails (Incremental vs Full Sync)
    logger.info(`Fetching email updates for account: ${accountId} (Cursor: ${account.lastSyncCursor || 'None'})`);
    const historyDetails = await emailProvider.fetchMessages(accountId, account.lastSyncCursor);

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
        }

        await AccountRepository.updateAccount(accountId, {
            lastSyncedAt: Date.now(),
            lastSyncCursor: newCursor,
        });
    } else {
        logger.info(`Performing full email sync for account: ${accountId}`);
        const fullSyncResult = await emailProvider.fetchMessages(accountId);

        if (fullSyncResult) {
            const { addedEmails, newCursor } = fullSyncResult;

            // Delete all previous emails for full sync
            logger.info(`Clearing existing emails for full sync of account: ${accountId}`);
            await EmailRepository.deleteEmailsByAccountId(accountId);

            if (addedEmails && addedEmails.length > 0) {
                logger.info(`Upserting ${addedEmails.length} emails after full sync for account: ${accountId}`);
                await EmailRepository.upsertEmailsInBulk(addedEmails);
                addedEmailsCount = addedEmails.length;
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
}
```

### 8. `src/core/queue/index.ts`

```typescript
import { logger } from '../../shared/utils/logger.js';
import { closeAllQueues, initQueueRegistry } from './queue.registry.js';
import { closeRedisConnection } from './redis.connection.js';
import { SyncWorker } from '../../workers/sync.worker.js';

let syncWorkerInstance: SyncWorker | null = null;

/**
 * Startup hook for job queue infrastructure & workers
 */
export function initBackgroundJobs(): void {
    logger.info('🚀 Initializing Background Job Queues...');
    initQueueRegistry();

    // Start background worker
    logger.info('👷 Starting Background Worker instances...');
    syncWorkerInstance = new SyncWorker();
    syncWorkerInstance.start();

    logger.info('🚀 Background Job Queues & Workers Initialized Successfully');
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

### 9. `src/modules/accounts/account.controller.ts`

```typescript
import { NextFunction, Request, Response } from 'express';
import { ConnectAccountSchema, DeleteAccountSchema, EnableAccountSchema, GetAccountDetailsSchema } from './account.schema.js';
import { AccountsService } from './account.service.js';

export class AccountsController {
    private accountsService: AccountsService;

    constructor() {
        this.accountsService = new AccountsService();
    }

    public getAccountDetails = async (req: Request<GetAccountDetailsSchema, object, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const accountId = req.params.accountId;
            if (!accountId) throw new Error('Account ID is required');
            const account = await this.accountsService.getAccountDetails(accountId);
            if (!account) res.status(404).send({ message: 'Account not found' });
            res.send(account);
        } catch (error) {
            next(error);
        }
    };

    public deleteAccount = async (req: Request<DeleteAccountSchema, object, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const accountId = req.params.accountId;
            if (!accountId) throw new Error('Account ID is required');
            await this.accountsService.deleteAccount(accountId);
            res.send({ message: 'Account deleted successfully' });
        } catch (error) {
            next(error);
        }
    };

    public getAccounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) throw new Error('User ID is required');
            const accounts = await this.accountsService.getAccounts(userId);
            res.send(accounts);
        } catch (error) {
            next(error);
        }
    };

    public getAccountProviders = async (req: Request<object, object, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const accountProviders = await this.accountsService.getAccountProviders();
            res.send(accountProviders);
        } catch (error) {
            next(error);
        }
    };

    public connect = async (req: Request<ConnectAccountSchema, object, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const redirectURL = await this.accountsService.connect(req.params.provider);
            res.send(redirectURL);
        } catch (error) {
            next(error);
        }
    };

    public callback = async (
        req: Request<ConnectAccountSchema, object, object, { code: string; state: string }>,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const provider = req.params.provider;
            const { code, state } = req.query;
            const parsedCode = String(code);
            const parsedState = String(state);
            const redirectURL = await this.accountsService.callback(provider, { code: parsedCode, state: parsedState });
            res.redirect(redirectURL);
        } catch (error) {
            next(error);
        }
    };

    public syncAccounts = async (req: Request<object, object, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) throw new Error('User ID is required');
            const response = await this.accountsService.syncAccounts(String(userId));
            res.status(202).send(response);
        } catch (error) {
            next(error);
        }
    };

    public syncAccount = async (req: Request<GetAccountDetailsSchema, object, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const accountId = req.params.accountId;
            const response = await this.accountsService.syncAccount(accountId);
            res.status(202).send(response);
        } catch (error) {
            next(error);
        }
    };

    public enableAccount = async (
        req: Request<GetAccountDetailsSchema, object, EnableAccountSchema>,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const accountId = req.params.accountId;
            const { active } = req.body;
            const response = await this.accountsService.enableAccount(accountId, active);
            res.send(response);
        } catch (error) {
            next(error);
        }
    };
}
```

### 10. `src/modules/accounts/account.service.ts`

```typescript
import { MAILSENSE_BASE_URL } from '@config';
import { ACCOUNT_PROVIDERS } from '@constants';
import { EmailProviderFactory } from '@integrations/email/email.provider.factory.js';
import { AccountProvider, AccountProviderType, SuccessAPIResponse, UpdateAPIResponse } from '@types';
import { decrypt, encrypt, logger } from 'shared/utils/index.js';
import { AccountDocument, AccountInput } from './account.model.js';
import { AccountRepository } from './account.repository.js';
import { QueueService } from '../../core/queue/queue.service.js';
import { SyncJobRepository } from './sync-job.repository.js';
import { EmailRepository } from '@modules/emails/email.repository.js';

export class AccountsService {
    constructor() {}

    /**
     * Fetches an account from the database by ID.
     */
    async getAccountDetails(accountId: string): Promise<AccountDocument> {
        try {
            const account = await AccountRepository.getAccountById(accountId);
            if (!account) throw new Error('Account not found');
            return account;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.getAccountDetails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    /**
     * Deletes an account from the database.
     */
    async deleteAccount(accountId: string): Promise<void> {
        try {
            await this.initiateAccountDeletion(accountId);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.deleteAccount: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    private async initiateAccountDeletion(accountId: string): Promise<void> {
        try {
            await AccountRepository.deleteAccount(accountId);
            await EmailRepository.deleteEmailsByAccountId(accountId);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.initiateAccountDeletion: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    /**
     * Fetches all accounts from the database.
     */
    async getAccounts(userId: string): Promise<AccountInput[]> {
        try {
            return AccountRepository.getAccounts({ userId });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.getAccounts: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    /**
     * Fetches all accounts from the database.
     */
    async getAccountProviders(): Promise<AccountProviderType[]> {
        try {
            return ACCOUNT_PROVIDERS;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.getAccountProviders: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    /**
     * Generates an OAuth consent URL for the given provider.
     */
    async connect(provider: string): Promise<{ url: string }> {
        try {
            if (provider === AccountProvider.GMAIL) {
                const url = await GmailUtils.buildGmailOAuthConsentURL();
                return { url };
            } else if (provider === AccountProvider.OUTLOOK) {
                const url = await OutlookUtils.buildOutlookOAuthConsentURL();
                return { url };
            } else {
                throw new Error('Invalid provider');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.connect: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    /**
     * Handles the callback from the OAuth provider.
     */
    async callback(provider: string, params: { code: string; state: string }): Promise<string> {
        try {
            const { code, state } = params;
            let userDetails;
            try {
                const decryptedState = decrypt(state);
                userDetails = JSON.parse(decryptedState);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                logger.error(`Error in AccountsService.callback: ${errorMessage}`, { error: err });
                throw err;
            }
            const emailProvider = EmailProviderFactory.getProvider(provider as AccountProvider);
            const { access_token, refresh_token, expires_in, scope } = await emailProvider.getAccessTokenFromCode(code);
            const userProfile = await emailProvider.getUserProfileFromAccessToken(access_token);
            const emailAddress = 'email' in userProfile ? userProfile.email : userProfile.mail;
            const account: Partial<AccountInput> = {
                id: Date.now(),
                userId: userDetails?.id,
                provider: provider as AccountProvider,
                emailAddress,
                userProfileDetails: userProfile,
                accessToken: encrypt(access_token),
                refreshToken: encrypt(refresh_token),
                accessTokenExpiry: Date.now() + expires_in * 1000,
                refreshTokenExpiry: expires_in,
                scope,
                syncEnabled: true,
                syncInterval: 60,
                lastSyncedAt: Date.now(),
                active: true,
            };
            const savedAccount = await AccountRepository.upsertAccount(account);
            
            // Queue sync for the newly connected account
            await this.syncAccount(String(savedAccount._id));
            
            return MAILSENSE_BASE_URL;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.callback: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async syncAccounts(userId: string): Promise<{ status: boolean; message: string; jobIds: string[] }> {
        try {
            const accounts = await AccountRepository.getAccounts({ userId, active: true });
            if (!accounts.length) return { status: true, message: 'Accounts not found', jobIds: [] };

            const jobIds: string[] = [];
            for (const account of accounts) {
                const jobId = await QueueService.addSyncAccountJob(
                    {
                        accountId: String(account._id),
                        userId: account.userId,
                        force: false,
                    },
                    1,
                );

                if (jobId) {
                    jobIds.push(jobId);
                    await SyncJobRepository.createSyncJob({
                        accountId: account._id,
                        bullJobId: jobId,
                        status: ACCOUNT_SYNC_JOB_STATUS.PENDING,
                        triggerType: ACCOUNT_SYNC_JOB_TRIGGER_TYPE.MANUAL,
                        startedAt: Date.now(),
                    });
                }
            }
            return { status: true, message: 'Accounts sync started!', jobIds };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.syncAccounts: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async syncAccount(accountId: string): Promise<{ status: boolean; message: string; jobId?: string }> {
        try {
            logger.info('Account Syncing Requested', { accountId });
            const account = await AccountRepository.getAccountById(accountId);
            if (!account) {
                throw Object.assign(new Error('Account not found'), {
                    status: 404,
                    isOperational: true,
                    description: 'Given account ID does not exist',
                    suggestedAction: 'Please check the account ID',
                });
            }
            if (!account.active) {
                throw Object.assign(new Error('Account is not active'), {
                    status: 400,
                    isOperational: true,
                    description: 'Given account is not active',
                    suggestedAction: 'Please activate the account',
                });
            }

            // Enqueue manual sync job with High Priority (Priority 1)
            const jobId = await QueueService.addSyncAccountJob(
                {
                    accountId,
                    userId: account.userId,
                    force: false,
                },
                1,
            );

            if (jobId) {
                await SyncJobRepository.createSyncJob({
                    accountId: account._id,
                    bullJobId: jobId,
                    status: ACCOUNT_SYNC_JOB_STATUS.PENDING,
                    triggerType: ACCOUNT_SYNC_JOB_TRIGGER_TYPE.MANUAL,
                    startedAt: Date.now(),
                });
            }

            return { status: true, message: 'Account sync queued successfully!', jobId };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.syncAccount: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async enableAccount(accountId: string, active: boolean): Promise<UpdateAPIResponse> {
        try {
            await AccountRepository.updateAccount(accountId, { active });
            return { status: true, message: `Account ${active ? 'enabled' : 'disabled'} successfully` };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.enableAccount: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
```

### 11. `src/workers/__tests__/sync.worker.test.ts`

```typescript
import { syncAccountProcessor } from '../processors/sync-account.processor.js';
import { IEmailProvider } from '@integrations/email/email.provider.js';
import { SyncAccountPayload } from 'core/queue/queue.service.js';
import { Job } from 'bullmq';
import { SyncJobResult } from '../sync.worker.js';
import { AccountRepository } from '@modules/accounts/account.repository.js';
import { EmailRepository } from '@modules/emails/email.repository.js';
import { FolderService } from '@modules/folders/folder.service.js';
import { EmailProviderFactory } from '@integrations/email/email.provider.factory.js';

jest.mock('@modules/accounts/account.repository.js');
jest.mock('@modules/emails/email.repository.js');
jest.mock('@modules/folders/folder.service.js');
jest.mock('@integrations/email/email.provider.factory.js');

describe('syncAccountProcessor', () => {
    let mockJob: Partial<Job<SyncAccountPayload, SyncJobResult>>;
    let mockProvider: IEmailProvider;

    beforeEach(() => {
        mockJob = {
            data: { accountId: 'account-123', userId: 'user-123' },
            id: 'job-123',
        };

        mockProvider = {
            fetchMessages: jest.fn(),
            getAccessTokenFromCode: jest.fn(),
            getUserProfileFromAccessToken: jest.fn(),
            getMessageDetails: jest.fn(),
            deleteEmails: jest.fn(),
            archiveEmails: jest.fn(),
            unreadEmails: jest.fn(),
            starEmails: jest.fn(),
            sendMail: jest.fn(),
            searchContacts: jest.fn(),
            getAllFolders: jest.fn(),
            createFolder: jest.fn(),
            updateFolder: jest.fn(),
            deleteFolder: jest.fn(),
        };

        (EmailProviderFactory.getProvider as jest.Mock).mockReturnValue(mockProvider);
        (FolderService.prototype.syncFolders as jest.Mock).mockResolvedValue({ status: true, message: 'folders synced' });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should perform incremental sync when history details are found', async () => {
        const mockAccount = {
            _id: 'account-123',
            provider: 'gmail',
            active: true,
            lastSyncCursor: 'cursor-old',
            userId: 'user-123',
        };

        (AccountRepository.getAccountById as jest.Mock).mockResolvedValue(mockAccount);
        jest.mocked(mockProvider.fetchMessages).mockResolvedValue({
            addedEmails: [{ providerMessageId: 'email-1', accountId: 'account-123' }],
            deletedEmailIds: ['email-old'],
            newCursor: 'cursor-new',
        });

        const result = await syncAccountProcessor(mockJob as Job<SyncAccountPayload, SyncJobResult>);

        expect(AccountRepository.getAccountById).toHaveBeenCalledWith('account-123');
        expect(mockProvider.fetchMessages).toHaveBeenCalledWith('account-123', 'cursor-old');
        expect(EmailRepository.deleteManyEmails).toHaveBeenCalledWith(['email-old']);
        expect(EmailRepository.upsertEmailsInBulk).toHaveBeenCalledWith([{ providerMessageId: 'email-1', accountId: 'account-123' }]);
        expect(AccountRepository.updateAccount).toHaveBeenCalledWith('account-123', {
            lastSyncedAt: expect.any(Number),
            lastSyncCursor: 'cursor-new',
        });
        expect(result).toEqual({ addedEmailsCount: 1, deletedEmailsCount: 1 });
    });

    it('should perform full sync when no history details are found', async () => {
        const mockAccount = {
            _id: 'account-123',
            provider: 'gmail',
            active: true,
            lastSyncCursor: null,
            userId: 'user-123',
        };

        (AccountRepository.getAccountById as jest.Mock).mockResolvedValue(mockAccount);
        jest.mocked(mockProvider.fetchMessages)
            .mockResolvedValueOnce(null) // Incremental returns null
            .mockResolvedValueOnce({
                addedEmails: [{ providerMessageId: 'email-2', accountId: 'account-123' }],
                deletedEmailIds: [],
                newCursor: 'cursor-full-new',
            }); // Full sync returns emails

        const result = await syncAccountProcessor(mockJob as Job<SyncAccountPayload, SyncJobResult>);

        expect(mockProvider.fetchMessages).toHaveBeenNthCalledWith(1, 'account-123', null);
        expect(mockProvider.fetchMessages).toHaveBeenNthCalledWith(2, 'account-123');
        expect(EmailRepository.deleteEmailsByAccountId).toHaveBeenCalledWith('account-123');
        expect(EmailRepository.upsertEmailsInBulk).toHaveBeenCalledWith([{ providerMessageId: 'email-2', accountId: 'account-123' }]);
        expect(AccountRepository.updateAccount).toHaveBeenCalledWith('account-123', {
            lastSyncedAt: expect.any(Number),
            lastSyncCursor: 'cursor-full-new',
        });
        expect(result).toEqual({ addedEmailsCount: 1, deletedEmailsCount: 0 });
    });
});
```

---

## Verification Plan

### Automated Tests

- Execute unit tests for workers using:
  ```bash
  NODE_ENV=local pnpm test
  ```
  Ensure all mocks resolve successfully and test cases coverage is maintained.

### Manual Verification

1. **Endpoint Response**:
   Trigger account sync through `/api/accounts/sync/:accountId` and ensure the HTTP status code returned is `202 Accepted` with a valid JSON payload containing a `jobId`.

2. **MongoDB History Audit**:
   Verify that a `SyncJob` entry is created with status `PENDING` right after enqueuing, transitions to `RUNNING` on execution start, and finishes with either `COMPLETED` (incrementing email metadata counts) or `FAILED` (with complete error stacks populated).

3. **Background Worker Processing Loop**:
   Monitor logging outputs to verify the sequential coordination of labels/folders syncing, followed by polymorphic email ingestion, database writes, and proper checkpoint updates.
