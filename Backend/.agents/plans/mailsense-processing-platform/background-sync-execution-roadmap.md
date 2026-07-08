# MailSense Background Sync System: Execution Roadmap

This document outlines the sequential phases, tasks, branch strategies, and execution criteria for implementing the asynchronous background synchronization pipeline in MailSense.

---

## Roadmap Overview

To minimize risk and ensure stability, the implementation is divided into five sequential, testable phases. Each phase is scoped to a specific feature branch and targets a discrete component of the system.

| Phase | Git Branch | Objective | Core Focus |
|---|---|---|---|
| **Phase 1** | `feature/sync-queue-infrastructure` | Setup Queue Engine | Redis connectivity, BullMQ setup, Registry & service classes. |
| **Phase 2** | `feature/sync-provider-strategy` | Strategic Provider Abstraction | Abstract Gmail and Outlook services under `IEmailProvider`. |
| **Phase 3** | `feature/sync-worker-pipeline` | Ingestion Worker & DB Updates | Core `SyncWorker` processing loop, schema updates, return 202 APIs. |
| **Phase 4** | `feature/sync-event-bus` | Event-Driven Propagation | Decoupled event propagation via `EventBus` class. |
| **Phase 5** | `feature/sync-schedulers-refresh` | Schedulers & Refresher | Account sync intervals, token refreshing, active status safety checks. |

---

## Detailed Execution Phases

### Phase 1: Infrastructure & Queue System Setup
* **Branch**: `feature/sync-queue-infrastructure`
* **Objective**: Install backend queuing dependencies, configure connection abstractions, and register queue managers.

#### Implementation Checklist
- [ ] Add `bullmq` and `ioredis` to `package.json` dependencies.
- [ ] Expose Redis parameters (`REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_TLS`) inside `src/core/config/app.config.ts`.
- [ ] Create Redis Connection client wrapper under `src/core/queue/redis.connection.ts`.
  * Ensure `maxRetriesPerRequest: null` is set.
- [ ] Design queue configuration objects and backoff defaults in `src/core/queue/queue.config.ts`.
- [ ] Implement queue instance caching/declaration logic in `src/core/queue/queue.registry.ts`.
- [ ] Create `QueueService` in `src/core/queue/queue.service.ts` exposing strongly typed `addJob` helpers.
- [ ] Add queue startup hook `initBackgroundJobs` and shutdown listener `shutdownBackgroundJobs` in `src/core/queue/index.ts`.
- [ ] Hook background job init and termination listeners in `src/server.ts` (handle `SIGINT`, `SIGTERM` signals).
- [ ] Write integration unit tests confirming Redis connectivity.

#### Files to Create
* `src/core/queue/redis.connection.ts`
* `src/core/queue/queue.config.ts`
* `src/core/queue/queue.registry.ts`
* `src/core/queue/queue.service.ts`
* `src/core/queue/index.ts`
* `tests/core/queue/queue.service.test.ts`

#### Files to Modify
* `package.json`
* `src/core/config/app.config.ts`
* `src/server.ts`

#### Acceptance Criteria
1. Server boots successfully and initializes connection to Redis.
2. Graceful shutdown triggers clean connection teardown of Redis clients.
3. Queue instances are declared dynamically without multiple allocations.

---

### Phase 2: Provider Strategy Pattern Implementation
* **Branch**: `feature/sync-provider-strategy`
* **Objective**: Restructure integrations to use standard interfaces, enabling the Sync Worker to run synchronization polymorphically.

#### Implementation Checklist
- [ ] Create common provider result definitions (`SyncResult`, `FolderResult`) and `IEmailProvider` interface under `src/providers/email/email.provider.ts`.
- [ ] Create `GmailProvider` adapter in `src/providers/email/gmail.provider.ts` implementing `IEmailProvider` and wrapping existing `GmailService`.
- [ ] Create `OutlookProvider` adapter in `src/providers/email/outlook.provider.ts` implementing `IEmailProvider` and wrapping existing `OutlookService`.
- [ ] Build the factory manager `EmailProviderFactory` under `src/providers/email/email.provider.factory.ts` returning the registered adapter class.
- [ ] Refactor existing account controllers and tests to remove references to concrete integrations (`GmailService`, `OutlookService`), relying instead on `EmailProviderFactory`.

#### Files to Create
* `src/providers/email/email.provider.ts`
* `src/providers/email/gmail.provider.ts`
* `src/providers/email/outlook.provider.ts`
* `src/providers/email/email.provider.factory.ts`
* `tests/providers/email/provider.factory.test.ts`

#### Files to Modify
* `src/modules/accounts/account.service.ts` (relocate direct API bindings)
* `src/modules/emails/email.service.ts`

#### Acceptance Criteria
1. All unit tests pass using mocked versions of `IEmailProvider`.
2. The Gmail and Outlook integrations conform strictly to the provider contract.
3. Adding a new provider requires registering a class in the factory rather than changing service layers.

---

### Phase 3: Workers and Sync Pipeline Rollout
* **Branch**: `feature/sync-worker-pipeline`
* **Objective**: Add tracking state attributes to the database, write the core worker logic, and modify the sync endpoints to function asynchronously.

#### Implementation Checklist
- [ ] Extend the Mongoose `AccountSchema` in `src/modules/accounts/account.model.ts` with sync state fields (`syncInProgress`, `lastSyncStatus`, `lastSyncError`, `lastSyncStartedAt`, `lastSyncCompletedAt`).
- [ ] Create the `SyncJob` MongoDB schema, model, and repository mapping background execution histories.
- [ ] Create `BaseWorker` and `SyncWorker` classes under `src/workers/`.
- [ ] Write the queue processor file `src/workers/processors/sync-account.processor.ts`.
  * Implement stages: Fetch database info, invoke strategized email fetch, normalize plain/HTML bodies, deduplicate, write to DB via `bulkWrite`, and update checkpoints.
- [ ] Modify `AccountService` and `AccountController` sync trigger:
  * Validate parameters (account exists and is active).
  * Call `QueueService.addSyncAccountJob` to queue job.
  * Return `202 Accepted` status back to the API client immediately.
- [ ] Implement manual sync priority overrides (Manual runs as priority 1, auto-scheduler runs as priority 2).

#### Files to Create
* `src/workers/base.worker.ts`
* `src/workers/sync.worker.ts`
* `src/workers/processors/sync-account.processor.ts`
* `src/repositories/sync-job.repository.ts`
* `src/modules/accounts/sync-job.model.ts`
* `tests/workers/sync.worker.test.ts`

#### Files to Modify
* `src/modules/accounts/account.model.ts`
* `src/modules/accounts/account.types.ts`
* `src/modules/accounts/account.controller.ts`
* `src/modules/accounts/account.service.ts`
* `src/modules/accounts/account.routes.ts`

#### Acceptance Criteria
1. API returns `202 Accepted` on sync trigger.
2. Worker picks up the job from Redis and completes ingestion asynchronously.
3. Account database fields reflect proper `syncInProgress` flags and history records populate `SyncJobs` collection.

---

### Phase 4: Event Bus & Decoupled Downstream Hooks
* **Branch**: `feature/sync-event-bus`
* **Objective**: Establish the internal event system to propagate actions cleanly across modules upon sync milestones.

#### Implementation Checklist
- [ ] Implement standard `EventBus` wrapper matching NodeJS `EventEmitter` in `src/core/events/event-bus.ts`.
- [ ] Formulate strongly typed event keys (`SystemEvent.SYNC_COMPLETED`, `SystemEvent.EMAIL_CREATED`) in `src/core/events/event.types.ts`.
- [ ] Integrate event triggers inside the `SyncWorker` pipeline:
  * Emit `SYNC_COMPLETED` at worker end.
  * Emit `EMAIL_CREATED` for each newly indexed message.
- [ ] Write event registration handlers in `src/core/events/handlers/`.
- [ ] Setup stub subscribers representing future systems (AI Worker, Dashboard indexer) to confirm message distribution.

#### Files to Create
* `src/core/events/event-bus.ts`
* `src/core/events/event.types.ts`
* `src/core/events/handlers/sync-completed.handler.ts`
* `src/core/events/handlers/email-created.handler.ts`

#### Files to Modify
* `src/workers/processors/sync-account.processor.ts`
* `src/core/queue/index.ts` (bind events on registry boot)

#### Acceptance Criteria
1. Sync operations generate exact type-safe event footprints.
2. Handlers consume fired events and run asynchronous processing without blocking the core worker pipeline.

---

### Phase 5: Schedulers & Token Refresher Integration
* **Branch**: `feature/sync-schedulers-refresh`
* **Objective**: Implement cron schedulers to auto-trigger synchronization, handle disabled accounts, and perform OAuth token refreshes.

#### Implementation Checklist
- [ ] Create the Scheduler process scanning database accounts on boot to register repeatable interval sync tasks in BullMQ.
- [ ] Set validation checks inside `SyncWorker` to gracefully abort syncs for accounts with `active: false` or `syncEnabled: false`.
- [ ] Design the background token refresher processor `src/workers/processors/refresh-token.processor.ts`.
- [ ] Wrap API client request locks: if a token expiry error is thrown during sync, execute the `REFRESH_TOKEN` job inline and retry.

#### Files to Create
* `src/workers/token-refresh.worker.ts`
* `src/workers/processors/refresh-token.processor.ts`
* `src/core/queue/scheduler.service.ts`

#### Files to Modify
* `src/workers/processors/sync-account.processor.ts`
* `src/core/queue/index.ts`
* `src/modules/accounts/account.service.ts`

#### Acceptance Criteria
1. Background schedulers periodically push sync jobs for active accounts.
2. Inactive/disabled accounts are ignored by schedulers.
3. Access tokens are updated automatically prior to synchronization calls.
