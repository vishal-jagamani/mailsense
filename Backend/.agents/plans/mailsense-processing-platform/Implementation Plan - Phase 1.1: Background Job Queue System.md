# Implementation Plan - Phase 1.1: Background Job Queue System

This plan outlines the architecture, code changes, and verification steps to implement a robust background job queue system using BullMQ and Redis.

## User Review Required

> [!IMPORTANT]
> The background job queue system requires a running Redis instance.
> Currently, `.env.local` contains the following credentials which will be used for local and dev testing:
> - `REDIS_HOST=52.66.222.172`
> - `REDIS_PORT=6379`
> - `REDIS_PASSWORD=redis@vishalec2`
> 
> Please ensure this Redis instance is active and accessible from your environment during development and execution.

## Open Questions

None at this stage, as all necessary credentials and requirements have been identified from the roadmap and active config files.

---

## Proposed Changes

### Dependencies

We will install `bullmq` (robust Redis-based queue) and `ioredis` (Redis client used by BullMQ) in the backend.

```bash
pnpm add bullmq ioredis
```

---

### Core Queue Module

We will create a new queue core module under `Backend/src/core/queue/` to encapsulate connection management, queues, and worker execution.

#### [NEW] [redis.connection.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/core/queue/redis.connection.ts)
- Manage the lifecycle of the `ioredis` connection client.
- Configure connection parameters using `REDIS_CONFIG` from `src/core/config/app.config.ts`.
- Ensure `maxRetriesPerRequest: null` is set (which is required by BullMQ).

#### [NEW] [queue.types.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/core/queue/queue.types.ts)
- Define TypeScript types/enums for queue names: `email-sync`, `email-processing`, and `cleanup`.
- Define payload interfaces for jobs (`SyncAccountPayload` and `ProcessEmailsPayload`).

#### [NEW] [queue.service.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/core/queue/queue.service.ts)
- Expose methods to enqueue jobs (e.g. `addSyncAccountJob`, `addEmailProcessingJob`).
- Define default job configurations including retry attempts (e.g., 3 retries for sync jobs) and exponential backoff.
- Implement queue shutdown helper to close connections cleanly.

#### [NEW] [queue.workers.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/core/queue/queue.workers.ts)
- Implement Workers for each queue:
  - **`email-sync`**: Calls `AccountsService.performAccountSync(accountId)` and awaits execution.
  - **`email-processing`**: Mock/skeleton processor for processing synced emails (event-driven placeholder for rules/AI).
  - **`cleanup`**: Runs a repeatable daily cleanup job at midnight using BullMQ's native cron scheduling to clean up completed/failed jobs older than 7 days from Redis.
- Setup logging listeners (`completed`, `failed`, `error`) to track job progress.
- Integrate with Sentry (`Sentry.captureException`) to monitor job failures.

#### [NEW] [index.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/core/queue/index.ts)
- Provide initialization (`initBackgroundJobs`) and shutdown (`shutdownBackgroundJobs`) orchestrators.

---

### Service Migration & Hooking

We will migrate the current fire-and-forget sync trigger to use the new queue and initialize background jobs on app startup.

#### [MODIFY] [account.service.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/accounts/account.service.ts)
- Rename or refactor current sync execution. Keep `syncAccount` as the entrypoint which validates parameters, but change it to enqueue the job instead of executing fire-and-forget logic.
- Add `performAccountSync(accountId: string)` which actually runs the synchronous `startAccountSync` sequence, to be called directly by the queue worker.
- Trigger the `email-processing` queue inside `syncGmailAccount` and `syncOutlookAccount` if new emails are synced.

#### [MODIFY] [server.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/server.ts)
- Import `initBackgroundJobs` and run it on startup after MongoDB connection is ready.
- Listen to process termination signals (`SIGINT`, `SIGTERM`) to trigger `shutdownBackgroundJobs()` and cleanly close workers/Redis before exiting.

#### [MODIFY] [tsconfig.json](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/tsconfig.json)
- Add alias path mapping `"@queue": ["core/queue/index.js"]` to standard path mappings.

---

## Verification Plan

### Automated Tests
- Run `pnpm type-check` to verify no compilation errors.
- Run `pnpm lint` and `pnpm format:check` to check code styles.

### Manual Verification
- Start the server using `pnpm dev`.
- Trigger email sync manually or link a new account (running OAuth flow).
- Inspect backend logs to verify:
  1. Redis connection is established successfully.
  2. Jobs are queued and transition successfully to `completed` state.
  3. The daily repeatable cleanup job registers correctly on startup.
