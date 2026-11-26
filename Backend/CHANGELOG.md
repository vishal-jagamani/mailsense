# Backend Changelog

All notable backend changes for MailSense are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this backend follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Transactional Mailer Strategy (`Backend/src/integrations/mailer/`):**
    - Implemented `ITransactionalMailer` contract (`mailer.types.ts`), `MailerFactory` singleton strategy selector (`RESEND`, `SMTP`, `NOOP`), and centralized Resend endpoint constants (`mailer.constants.ts`).
    - Implemented `ResendMailerProvider` using shared `apiRequest` HTTP client, `SmtpMailerProvider` using `nodemailer` with timeout options, and `NoopMailerProvider` for offline/CI runs.
    - Added `nodemailer` and `@types/nodemailer` dependencies in `Backend/package.json`.
- **Persistent Error Logging & Throttled Email Alerting (`Backend/src/modules/observability/`):**
    - Added categorized `observability` module (`constants/`, `controllers/`, `database/`, `routes/`, `schemas/`, `services/`, `types/`, `utils/`, `index.ts`).
    - Implemented `ErrorLog` Mongoose model (`database/error-log.model.ts`) implementing `ErrorLogAttributes` (`@mailsense/types v1.9.0`) with deduplicated `fingerprint` unique index and 90-day TTL retention index (`expireAfterSeconds: 7776000`).
    - Implemented pure `ErrorLogRepository` (`upsertErrorLog`, `countUnresolved`) without `try/catch` blocks.
    - Implemented `ObservabilityService` with singleton `observabilityService`, non-PII `sanitizeContext`, SHA-256 `computeFingerprint`, HTML-escaped alert email formatting (`ALERT_EMAIL_TEXT`, `ALERT_EMAIL_HTML`), Redis alert cooldown locking (`SET alert:cooldown:<fingerprint> 1 EX <seconds> NX`) with bounded in-memory fallback map, and non-blocking DB error containment.
    - Added public-compatible, Zod-validated `POST /api/observability/client-errors` route protected by `clientErrorRateLimiter` (`20 requests / 15m` in `rate-limit.config.ts`).
- **Observability Configuration & Unit Tests:**
    - Extended `env.schema.ts`, `env.config.ts`, and `app.config.ts` with `APP_VERSION`, `MAILER_CONFIG`, `ALERTING_CONFIG`, and boolean parsing for `EMAIL_ALERT_EMAIL_ENABLED`.
    - Extended `LOGGER_MODULE` in `observability.constants.ts` with observability and mailer module tags.
    - Added unit tests in `Backend/src/integrations/mailer/__tests__/mailer.factory.test.ts` and `Backend/src/modules/observability/__tests__/observability.service.test.ts`.

### Changed

- **Boundary Error Wiring & Sentry Deduplication:** Wired `observabilityService.recordAndAlertError` into `errorHandler` (`error.handler.ts`, via extracted `reportUnhandledException` helper keeping cyclomatic complexity compliant) and `BaseWorker` (`base.worker.ts`), configuring boundary loggers with `{ forwardToMonitoring: false }` to eliminate duplicate Sentry events and prevent logging recursion.
- **Type Safety & Release Tag Hygiene (Phase 1):** Removed prohibited `: unknown` and `: never` usages in `gemini.provider.ts`, `ai-processing.processor.ts`, `AxiosApiError.ts`, `error.handler.ts`, and `observability.types.ts` via `CaughtError`, `GeminiRawApiError`, and `LoggableValue`; updated `MonitoringManager` fallback release tag to `'3.8.0'`.
- **Workspace Contract Linking:** Configured `@mailsense/types` workspace linking (`link:../../mailsense-types`) in `Backend/package.json` synced to `v1.9.0` contracts.

### Security & Removed

- **Staged Attachment IDOR Enforcement:** Restored caller `userId` and `accountId` verification in `EmailWriteService.resolveStagedAttachments`, passing `attachment-security.test.ts`.
- **Alert Email XSS Hardening:** Added `escapeHtml` sanitization in `observability.utils.ts` for rendered fields inside `ALERT_EMAIL_HTML`.
- **Debug Leftover Cleanup (Phase 1):** Removed `/testEndpoint` route from `app.ts` and `HEALTH_PROBES_API_ENDPOINTS` (`observability.constants.ts`), and removed dead test URL from `app.config.ts`.

## [3.7.0] - 2026-11-24

### Added

- **AI Provider Strategy Pattern & Infrastructure (Phase 1):**
    - Implemented `IAiProvider` interface and `AiProviderFactory` singleton strategy selector and cache supporting `gemini` and `noop` providers.
    - Implemented `GeminiAiProvider` utilizing the modern `@google/genai` SDK with strict JSON schema constraints (`responseSchema`), 30-second `AbortController` timeouts, payload sanitization, and structured rate-limit (`RateLimitError`) error translation.
    - Defaulted model to `gemini-3.6-flash` via `GOOGLE_GEMINI_MODEL` environment variable and `AI_CONFIG`.
    - Implemented `NoopAiProvider` for offline development, local mock generation, and CI test environments.
    - Added `ErrorCode.AI_PROCESSING_FAILED`, `AiProcessingErrorParams`, and `AiProcessingError` domain error carrying duration telemetry, trace ID, and operational metadata.
    - Added `AI_PROVIDER`, `GOOGLE_GEMINI_API_KEY`, and `GOOGLE_GEMINI_MODEL` Zod schema validation in `env.schema.ts`, `env.config.ts`, and `app.config.ts`.
    - Extended `LOGGER_MODULE` in `observability.constants.ts` with `GEMINI_PROVIDER`, `NOOP_AI_PROVIDER`, `AI_PROVIDER_FACTORY`, `AI_SERVICE`, `AI_CONTROLLER`, `AI_WORKER`, and `AI_PROCESSING_PROCESSOR`.
    - Added unit test suites for `AiProcessingError`, `AiProviderFactory`, and `GeminiAiProvider`.
- **Asynchronous AI Queue & Ingestion Pipeline (Phase 2):**
    - Extended `EmailSchema` with AI categorization, priority, tags, summary, provider, and timestamp attributes, along with compound query indexes (`accountId + aiCategory + receivedAt`, `accountId + aiPriority + receivedAt`).
    - Added `EmailRepository.updateEmailAiMetadata` for updating email AI classification metadata without `try/catch`.
    - Extended `UserSettingsSchema` and `UserSettingsRepository.getAiSettings` for user AI consent, feature flags, and per-account exclusion settings.
    - Registered `QUEUE_NAMES.AI_PROCESSING` in `queue.config.ts` and created `QueueService.enqueueAiProcessingJob`.
    - Created dedicated queue types in `src/core/types/queue.types.ts` (`SyncAccountPayload`, `RefreshTokenPayload`, `EnqueueJobOptions`).
    - Implemented `AIProcessingWorker` in `src/workers/workers/ai.worker.ts` with `concurrency: 5` and `limiter: { max: 50, duration: 60000 }` (Gemini RPM rate limiter).
    - Implemented `aiProcessingProcessor` in `src/workers/processors/ai-processing.processor.ts` with idempotency guards, user privacy verification, payload sanitization, and structured rate limit backoff via `queue.rateLimit()`.
    - Connected `EMAIL_BATCH_SYNCED` event in `email-batch-synced.handler.ts` to automatically enqueue background AI jobs for newly ingested email batches.
    - Added `AIProcessingWorker` lifecycle management in `initBackgroundJobs` and `shutdownBackgroundJobs`.
    - Organized workers into categorized `src/workers/workers/` directory (`ai.worker.ts`, `sync.worker.ts`, `token-refresh.worker.ts`).
- **Core AI REST API Module & Mailbox Filter Extensions (Phase 3):**
    - Implemented categorized `Backend/src/modules/ai/` module (`constants/`, `types/`, `schema/`, `controllers/`, `services/`, `routes/`, `index.ts`).
    - Implemented `GET /api/ai/summary/:emailId` for on-demand conversation thread summarization with full thread message aggregation, plain-text body decompression, and multi-tenant authorization checks.
    - Implemented `GET /api/ai/suggestions/:emailId` for contextual suggested replies with multi-message context and tone variants.
    - Extended `getAllEmailsSchema` with optional `aiCategory` and `aiPriority` filters.
    - Extended `EMAIL_LIST_DB_FIELD_MAPPING` to project `aiCategory`, `aiPriority`, and `aiSummary` in mailbox list queries.
    - Extended `EmailQueryService` to filter by `aiCategory` and `aiPriority` in MongoDB search query and map fields to `EmailListItem`.
    - Mounted `/api/ai` router in `Backend/src/routes.ts`.
- **AI Settings & Privacy Controls (Phase 4):**
    - Added `updateAiSettings` atomic update method to `UserSettingsRepository` with `$set` on nested preference fields (`ai.enabled`, `ai.features`, `ai.disabledAccountIds`, `ai.consentGivenAt`).
    - Added `getUserAiSettings` and `updateUserAiSettings` methods to `UserService` with default initialization, telemetry logging, and Sentry tracking.
    - Added `userAiFeatureSettingsSchema` and `updateUserAiSettingsSchema` in `Backend/src/modules/user/schema/user.schema.ts`.
    - Exposed `GET /users/settings/ai` and `PATCH /users/settings/ai` in `UserController` and `Backend/src/modules/user/routes/user.routes.ts`.
    - Added unit test suite in `Backend/src/modules/user/__tests__/user-ai-settings.test.ts`.
- **AI Processing Ingestion & Pipeline Refinements (Phase 5):**
    - Enhanced `aiProcessingProcessor` to decompress compressed plain-text email bodies using `decompressString(email.bodyPlain)` prior to prompt construction and tokenization.
    - Added `upsertSyncJob` in `SyncJobRepository` and tracked `triggerType` (`SCHEDULED` vs `MANUAL`) for background sync jobs.
    - Refactored `EnvConfig.loadDotenv` method extraction and `UserService` helper methods (`resolveAiSettings`, `resolveAiFeatures`, `createDefaultAiSettings`) to satisfy strict code size & function limits.

## [3.6.1] - 2026-11-17

### Added

- **Auth0 Payload Sanitization & Typed Contracts:** Added `Auth0UpdateUserPayload` interface in `src/integrations/auth0/auth0.types.ts` and `buildAuth0UpdatePayload` helper in `src/integrations/auth0/auth0.utils.ts` to strip undefined fields and type-check user update payloads before sending to Auth0 Management API.
- **External Auth0 Error Normalization:** Added structured `AxiosApiError` wrapping in `Auth0Api.updateUserDetails` and `changeUserPassword` to normalize external provider rejections into domain errors.

### Changed

- **Database Connection Manager Configuration:** Configured explicit `dbName: DATABASE` option in `DatabaseConnectionManager` (`src/core/database/connection.ts`) and `DatabaseConnectionOptions` (`src/core/types/database.types.ts`) ensuring MongoDB client explicitly binds to the target database.
- **Account Sanitization Alignment:** Updated `AccountsReadService.sanitizeAccount` (`src/modules/accounts/services/account-read.service.ts`) and test suite `account-sanitization.test.ts` to emit `emailAddress`, `active`, `lastSyncedAt` (as timestamp), and `syncInterval` matching the updated `SanitizedAccountAttributes` contract.
- **User Validation Schema Expansion:** Added `userMetadataSchema` and expanded `updateUserSchema` in `src/modules/user/schema/user.schema.ts` to validate `nickname`, `picture`, `email_verified`, `sub`, and `user_metadata`.
- **Analytics Metric Upsert Snapshot:** Refactored `AnalyticsRepository.upsertDailyAccountMetrics` (`src/modules/analytics/database/analytics.repository.ts`) to upsert matching on `{ accountId }`, preventing duplicate daily metric entries and maintaining a consistent account metric snapshot.

## [3.6.0] - 2026-11-15

### Security

- **Multi-Tenant Authorization Hardening (`BUG-V13-01`, `BUG-V13-02`, `BUG-V13-03`):**
    - Enforced caller `userId` validation in `EmailQueryController` and `EmailReadService` for `getEmail`, `getThread`, `downloadAttachment`, and `downloadAttachmentStream`, blocking cross-tenant access to messages, threads, and binary attachments.
    - Enforced caller `userId` validation in `FolderController` and `FolderService` for `syncFolders`, `getFolder`, `getAccountFolders`, and `createFolder`, throwing `ForbiddenError` when an unowned `accountId` is targeted.
    - Activated staged attachment ownership validation in `EmailWriteService.composeEmailWithAttachments`, ensuring all attachment IDs belong to both the caller `userId` and the target `accountId`. Verified with `src/modules/emails/__tests__/attachment-security.test.ts`.
- **Debug Router Decommissioning (`BUG-V14-01`):** Unmounted the `/api/utils` router and deleted `src/modules/utils/` to eliminate insecure access token retrieval and decryption oracle endpoints.
- **Multi-Tenant Draft Scoping (`BUG-V14-04`):** Scoped `DraftRepository.updateDraft` to `{ _id: draftId, userId }` using `DraftModel.findOneAndUpdate`, preventing cross-tenant draft modification. Added multi-tenant test coverage in `src/modules/drafts/__tests__/draft-security.test.ts`.
- **Authorized Single Email Access (`BUG-V14-03`):** Included `userId: 1` in `EmailThreadService.getEmail` account projection, eliminating false-positive 403 Forbidden errors for valid account owners. Added test coverage in `src/modules/emails/__tests__/email-thread-security.test.ts`.
- **Staged Attachment Account Authorization (`BUG-V14-07`):** Enforced `account.userId === userId` in `AttachmentService.uploadStagedAttachment`. Added test coverage in `src/modules/attachments/__tests__/attachment-upload-security.test.ts`.

### Added

- **Database Connection Manager (`ARCH-V13-01`):** Extracted raw MongoDB connection logic from `server.ts` into enterprise `DatabaseConnectionManager` (`src/core/database/connection.ts`) with typed options, reconnect monitoring, and graceful shutdown handling. Added `@database` path alias.
- **Categorized Email Module Subdirectories:**
    - Decomposed `email.controller.ts` into `EmailQueryController` (`src/modules/emails/controllers/email-query.controller.ts`) and `EmailMutationController` (`src/modules/emails/controllers/email-mutation.controller.ts`) with barrel export `src/modules/emails/controllers/index.ts`.
    - Decomposed `email.service.ts` into `EmailReadService` and `EmailWriteService` under `src/modules/emails/services/` with composite facade `src/modules/emails/services/email.service.ts`.
- **Outlook Integration Modularization:** Decomposed monolithic `outlook.service.ts` into `OutlookSyncService`, `OutlookMailReadService`, and `OutlookMailWriteService` under `src/integrations/outlook/services/` with unified composite facade in `services/index.ts`.
- **Gmail Integration Modularization:** Decomposed monolithic `gmail.service.ts` into dedicated domain services: `GmailAuthService`, `GmailMessageService`, `GmailAttachmentService`, and `GmailLabelService` under `src/integrations/gmail/services/` with barrel export `services/index.ts`.
- **Zero-Inline Type System & Domain Isolation:**
    - Added dedicated interface files: `src/core/types/event.types.ts` (`PublishEventPayload`), `src/core/types/middleware.types.ts` (`SchemaMap`), `src/core/types/common.types.ts` (`GetDataRangeResponse`), and `src/integrations/storage/storage.types.ts` (`ObjectStream`).
    - Added domain-specific type definitions in `src/integrations/gmail/gmail.types.ts` (`GmailMessageIdParam`, `GmailAttachmentBufferResult`, `GmailMimeMessageAttachment`) and `src/integrations/outlook/outlook.types.ts` (`OutlookMessageIdParam`, `OutlookDeltaMessagesResponse`, `OutlookMessageAttachmentResponse`, `SplitAttachmentsResponse`, `OutlookAttachmentBufferResult`), preserving domain isolation between provider ecosystems.
    - Added named interfaces in `src/modules/analytics/analytics.types.ts` (`EmailVolumeDataPointBase`, `AccountEmailMetricsBase`), `src/modules/emails/email.types.ts` (`PaginationParams`), and `src/integrations/auth0/auth0.types.ts` (`Auth0UserChangePassword`).
- **Outlook Mail Client Modularization:** Decomposed `outlook-mail.client.ts` into single-responsibility client classes: `OutlookMailReadClient` (`src/integrations/outlook/clients/outlook-mail-read.client.ts`) and `OutlookMailWriteClient` (`src/integrations/outlook/clients/outlook-mail-write.client.ts`), each strictly within the 300-line limit, with backward-compatible `OutlookClient` static facade in `clients/index.ts`.
- **Categorized Email Services Decomposition:** Decomposed `EmailReadService` (329 lines) into single-responsibility services under `src/modules/emails/services/`:
    - `EmailQueryService`: Querying, search, contact suggestions, and filters.
    - `EmailThreadService`: Thread conversation retrieval and individual message resolution.
    - `EmailAttachmentService`: Attachment buffers and binary stream downloads.
    - Updated `EmailService` composite facade delegating cleanly to query, thread, attachment, and write services.
- **Categorized Database Subdirectories:** Moved Mongoose models, queries, and repositories into dedicated `database/` subdirectories:
    - `src/modules/emails/database/`: `email.model.ts`, `email.queries.ts`, `email.repository.ts`.
    - `src/modules/analytics/database/`: `analytics.queries.ts`, `analytics.repository.ts`.
- **Database & Monitoring Utility Modularization:**
    - Added `src/core/types/database.types.ts` (`DatabaseConnectionOptions`).
    - Added `src/core/monitoring/providers/sentry.utils.ts` (`extractUserId`, `extractUserEmail`, `extractUserUsername`, `extractUserIp`, `extractOverrideUserFromData`, `omitUserKeys`).
    - Added `DefaultMonitoringConfig` in `src/core/types/monitoring.types.ts`.
    - Added `src/modules/analytics/types/index.ts` consolidating analytics contracts.
- **Environment Schema Extraction:** Extracted Zod configuration map `envSchemaObject` to `src/core/config/env.schema.ts` to reduce `EnvConfig` constructor length below 50 lines.
- **Error Types & Decomposition:** Extracted `ParsedErrorDetails` interface in `src/core/types/error.types.ts` and refactored `AxiosApiError` constructor into focused helper functions (`extractAxiosMessage`, `extractAxiosMetadata`, `parseAxiosError`, `resolveErrorDetails`) for cyclomatic complexity compliance.
- **Analytics Utility Modularization:** Decomposed `analytics.utils.ts` into pure formatting helpers (`analytics-formatters.ts`) and statistical calculation algorithms (`analytics-calculators.ts`) under `src/modules/analytics/utils/` with barrel export `index.ts`.
- **Categorized Subdirectory Architecture Standardization (Rule 5.5 / `STRUCT-V14-03`):** Reorganized all 7 backend feature modules (`accounts/`, `analytics/`, `attachments/`, `drafts/`, `emails/`, `folders/`, `user/`) into standardized categorized subdirectories (`constants/`, `controllers/`, `database/`, `routes/`, `schema/`, `services/`, `types/`) with barrel exports (`index.ts`).
- **Specialized Gmail Message Services (`REFACTOR-V14-05`):** Decomposed `gmail-message.service.ts` into `GmailMessageReadService` and `GmailMessageWriteService` under `src/integrations/gmail/services/`.
- **Specialized Gmail Utilities (`REFACTOR-V14-02`):** Decomposed monolithic `gmail.utils.ts` into `gmail-mime.utils.ts` and `gmail-header.utils.ts` under `src/integrations/gmail/utils/`.
- **Account Sync Coordinator (`REFACTOR-V14-03`):** Extracted `AccountSyncCoordinatorService` (`src/modules/accounts/services/account-sync-coordinator.service.ts`) to manage BullMQ queue dispatching and priority scheduling.
- **Shared Analytics Utilities (`REFACTOR-V14-09`):** Extracted common statistical calculation helpers to `src/modules/analytics/utils/analytics-common.utils.ts`.
- **Integration Email Barrel (`@integrations/email/index.ts`):** Consolidated email provider factory and interfaces into unified barrel export.

### Removed

- **Orphan Legacy Code Deletion (`BUG-V14-05`, `STRUCT-V14-01`):** Deleted 289-line dead legacy `email.controller.ts` and 0-byte orphan `outlook.service.ts`.

### Changed

- **Core Middlewares Relocation:** Relocated cross-cutting middlewares from root `src/middlewares/` to `src/core/middlewares/` (`auth.ts`, `error.handler.ts`, `validator.ts`, `index.ts`), updating `@middlewares` path alias and route imports.
- **Worker Processor Complexity Reduction:** Refactored `syncAccountProcessor` in `src/workers/processors/sync-account.processor.ts` into focused private helper methods, reducing cyclomatic complexity from 32 to $\le 8$ and nesting depth from 6 to $\le 3$.
- **Auth & Queue Complexity Reduction:**
    - Refactored `AuthMiddleware` in `src/core/middlewares/auth.ts` with `extractUserFromRequest` and `getFirstString` helpers.
    - Refactored `SchedulerService.upsertAccountRepeatableJob` with `isEligibleForSync`, `resolveSyncIntervalMinutes`, and `cleanMismatchedSchedulers`.
    - Refactored `BaseWorker` in `src/workers/base.worker.ts` with `extractTraceContext` and `runWithTraceContext`.
- **Error Handler & Monitoring Complexity Reduction:** Refactored `errorHandler` in `src/core/middlewares/error.handler.ts` into `normalizeAppError` and `captureNonOperationalErrors` helpers. Extracted `breadcrumbLevel` method in `SentryMonitoringProvider` (`src/core/monitoring/providers/sentry.provider.ts`) to comply with function size and complexity guardrails.
- **User Schema Index Deduplication:** Eliminated duplicate index warning on `userId` in `src/modules/user/user.model.ts`.
- **Compound Index Deduplication (`BUG-V14-08`):** Removed redundant compound index `{ accountId: 1, threadId: 1 }` from `email.model.ts`.
- **Logic Deduplication (`REFACTOR-V14-01`):** Removed duplicate `getDateRange` in `email-query.service.ts`, importing canonical `@utils` helper.
- **Strict Barrel Import Enforcement:** Standardized all internal backend imports to reference barrel `index.js` exports across all modules.
- **Jest Path Mapping Alignment:** Updated `jest.config.js` `moduleNameMapper` with `@middlewares`, `@database`, `@security`, and `@queue` aliases to ensure clean test resolution.
- **ESLint Zero-Error & Zero-Warning Remediation:** Resolved all ESLint errors and warnings across the backend repository to achieve **0 problems (0 errors, 0 warnings)** with `--max-warnings 0`.

## [3.5.0] - 2026-10-15

### Added

- **Security & Multi-Tenant Isolation (`SEC-REFACTOR-01`):** Enforced IDOR validation in `EmailWriteService.composeEmailWithAttachments`, validating that staged attachments belong to both the authenticated `userId` and target `accountId` before message composition and throwing `ForbiddenError` on cross-tenant access. Added unit test suite `src/modules/emails/__tests__/attachment-security.test.ts`.
- **Domain Client Modularization (`ARCH-REFACTOR-01`):** Decomposed monolithic `GmailClient` and `OutlookClient` into focused domain client classes:
    - Gmail: `GmailAuthClient`, `GmailMessageClient`, `GmailLabelClient`, and `GmailContactClient` under `src/integrations/gmail/clients/` with static facade in `src/integrations/gmail/clients/index.ts`.
    - Outlook: `OutlookAuthClient`, `OutlookMessageClient`, `OutlookFolderClient`, and `OutlookContactClient` under `src/integrations/outlook/clients/` with static facade in `src/integrations/outlook/clients/index.ts`.
- **Account OAuth Service Extraction (`ARCH-REFACTOR-02`):** Extracted `AccountOAuthService` (`src/modules/accounts/account-oauth.service.ts`) from `AccountsService`, encapsulating OAuth connection URL generation, authorization code exchange, profile retrieval, and background sync triggering into a dedicated domain service.
- **Consolidated Batch Provider Operations (`ARCH-REFACTOR-03`):** Implemented `executePerAccountProviderAction` in `EmailWriteService` (`src/modules/emails/email-write.service.ts`), consolidating multi-account batch mutations (`archiveEmails`, `starEmails`, `unreadEmails`, `deleteEmail`) using `Promise.allSettled` and atomic MongoDB updates exclusively for successful accounts.
- **Named Interface Extractions:** Defined dedicated interfaces in `src/modules/accounts/account.types.ts` (`OAuthConnectResponse`, `OAuthCallbackParams`, `SyncAccountsResponse`, `SyncAccountJobResponse`) and `src/modules/emails/email.types.ts` (`ThreadSummaryItem`, `GroupedEmailThreadItem`) to eliminate inline object types.
- **ESLint 9 Flat Config Migration (`DX-REFACTOR-01`):** Upgraded `eslint.config.js` to modern Flat Config format with TypeScript-ESLint, enforcing `no-restricted-syntax` for zero inline object types (with targeted exemptions for type definition files `*.types.ts` and `*.interface.ts`), line count, function length, and complexity limits.

### Changed

- **Shared Type Contracts (@mailsense/types v1.6.0):** Integrated `@mailsense/types` `1.6.0`, normalizing `to`, `cc`, and `bcc` recipient fields strictly to `string[]` arrays across Gmail and Outlook providers, repositories, parsers, and search formatters.
- **Account Privacy & Sanitization:** Guaranteed that sensitive encrypted OAuth credentials (`accessToken`, `refreshToken`) are never returned in public account responses, strictly delivering `SanitizedAccountAttributes[]`.

## [3.4.0] - 2026-09-27

### Added

- **Email Service Decomposition (`ARCH-NEXT-01`):** Decomposed `email.service.ts` into single-responsibility service layers adhering to CQRS principles: `EmailReadService` (`src/modules/emails/email-read.service.ts`) for query/threading/attachment handling and `EmailWriteService` (`src/modules/emails/email-write.service.ts`) for composition/moves/batch mutations. Refactored `EmailService` (`src/modules/emails/email.service.ts`) into a lightweight Facade preserving 100% of method signatures for caller non-regression (`EmailController`, `DraftService`).
- **Attachment Streaming (`PERF-NEXT-01`):** Added `getAttachmentStream` across `IEmailProvider`, `GmailClient`, `OutlookClient`, `GmailProvider`, `OutlookProvider`, and `EmailService`. Refactored `EmailController.downloadAttachment` to stream binary attachments directly to Express `Response` via `attachment.stream.pipe(res)` with `Content-Type`, `Content-Disposition`, and `Content-Length` headers and error listeners, eliminating memory heap buffering.
- **Multi-Account Batch Parallelization (`PERF-NEXT-02`):** Parallelized `EmailService.moveEmails` using `Promise.allSettled` across account groups, returning aggregated update counts and updating MongoDB folder references exclusively for successful accounts while logging partial failures.
- **Provider Streaming Contracts:** Added typed `AttachmentStreamResult` and `AccountBatchMoveTaskResult` interfaces in `src/integrations/email/email.provider.types.ts`.
- **API Ingress Rate Limiting (`SEC-NEXT-01`):** Integrated `express-rate-limit` with bucket configurations (`defaultApiRateLimiter`, `syncRateLimiter`, `composeRateLimiter`, `authRateLimiter`) in `src/core/security/rate-limit.config.ts`, delegating 429 rejections to `RateLimitError` and centralized `errorHandler`.
- **HTTP Security Headers & CSP (`SEC-NEXT-02`):** Implemented `createHelmetMiddleware` in `src/core/security/helmet.config.ts` mounting Content Security Policy (CSP), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and HSTS across Express ingress in `app.ts`.
- **Security Module & Path Alias:** Added `@security` alias in `tsconfig.json` exporting security middleware from `src/core/security/index.ts`.
- **Security Unit Testing:** Added test suites `src/core/security/__tests__/rate-limit.test.ts` and `src/core/security/__tests__/helmet.test.ts`.
- **AI Event Pipeline Foundation (`ARCH-NEXT-02`):** Integrated `SYSTEM_EVENT.EMAIL_BATCH_SYNCED` event dispatch in `syncAccountProcessor` during both incremental and full background sync flows, resolving MongoDB `_id` strings and emitting typed `EmailBatchSyncedPayload` payloads.
- **Event Subscriber:** Added `registerEmailBatchSyncedHandler` in `src/core/events/handlers/email-batch-synced.handler.ts` subscribing to `EMAIL_BATCH_SYNCED` with structured logging.
- **Observability:** Added `EMAIL_BATCH_SYNCED_HANDLER` to `LOGGER_MODULE` enum.
- **Repository Helper:** Implemented `EmailRepository.getEmailIdsByProviderMessageIds` with tenant `accountId` isolation.
- **Unit Testing:** Added unit test suite `src/core/events/__tests__/email-batch-synced.handler.test.ts`.

## [3.3.0] - 2026-09-26

### Fixed

- Fixed BUG-10 (Email ID Boundary): Decoupled Frontend from external `providerMessageId`; Frontend passes canonical MongoDB `_id` and Backend resolves `providerMessageId` via `EmailRepository.getEmailsByIds` before delegating to provider adapters (`deleteEmail`, `archiveEmails`, `starEmails`, `unreadEmails`, `moveEmails`).
- Fixed BUG-12 (Folder ID Boundary): Decoupled Frontend from external `providerFolderId`; Frontend passes canonical MongoDB `_id` and Backend resolves `providerFolderId` via `FolderRepository.getFolder` and `FolderRepository.getFoldersByIds` before delegating to provider adapters (`updateFolder`, `deleteFolder`, `moveEmails`, `getEmails`).
- Fixed BUG-12 (Database Synchronization): Restored `EmailRepository.updateFolders` in `EmailService.moveEmails` and implemented `FolderRepository.updateFolder` and `FolderRepository.deleteFolder` in `FolderService` to keep MongoDB records in sync with external providers.
- Fixed BUG-06 (Control Flow Crash): Added missing `return` statement following early 400 error in `EmailController.searchEmails` to prevent `ERR_HTTP_HEADERS_SENT` Node.js process crashes.
- Fixed BUG-07 (Control Flow Crash): Added missing `return` statement following early 404 response in `AccountsController.getAccountDetails` to prevent `ERR_HTTP_HEADERS_SENT` Node.js process crashes.
- Fixed BUG-02 (Folder Search): Corrected folder search in `FolderService.getAllFolders` to query the `name` field using `$regex` instead of querying non-existent `subject`/`from` fields.
- Fixed BUG-04 (Search Pagination): Fixed total count in `EmailService.searchEmails` by executing `EmailRepository.countDocuments(searchQuery)` rather than returning page slice length.
- Fixed BUG-08 (Error Typing): Replaced raw `Object.assign(new Error(...))` in `AccountsService.syncAccount` with domain-specific `NotFoundError` and `BadRequestError`.
- Fixed BUG-09 (Draft Dispatch Parameters): Forwarded `cc`, `bcc`, `inReplyTo`, and `attachmentIds` in `DraftService.sendDraft` to provider `sendMail`.
- Fixed BUG-11 (Folder Pagination): Corrected `FolderService.getAllFolders` response envelope to return the actual requested `page` parameter rather than hardcoded `page: 1`.
- Fixed SEC-02 (Tenant Isolation): Enforced caller `userId` validation in `AccountsService` for `getAccountDetails`, `deleteAccount`, `syncAccount`, and `enableAccount`.
- Fixed SEC-03 (Credential Redaction): Stripped sensitive `accessToken` and `refreshToken` credentials in `AccountsService.getAccountDetails` and `getAccounts`, returning `SanitizedAccountAttributes`.
- Fixed SEC-07 (Email Move Authorization): Enforced caller ownership verification over target email IDs in `EmailService.moveEmails` before dispatching move commands to providers.
- Fixed Exception Handling & Logging Audit (Phase 2):
    - Replaced 50+ generic `throw new Error(...)` calls across services, controllers, provider clients, and background workers with compiler-enforced domain errors (`NotFoundError`, `BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `SyncError`).
    - Remediated unhandled exception gaps in `UserService`: wrapped all 6 service methods (`getUser`, `updateUser`, `getUserProfile`, `changePassword`, `getUserSettings`, `updateUserSettings`) in explicit `try / catch` blocks with module-scoped logging and `NotFoundError` throws.
    - Enforced caller authorization checks in `AttachmentsService.deleteStagedAttachment`, `FolderService.updateFolder`, and `FolderService.deleteFolder` using `ForbiddenError` to prevent cross-tenant mutations.
    - Enforced account ownership verification in `EmailService.composeEmailWithAttachments` with `ForbiddenError` before initiating provider dispatch.
    - Replaced generic worker exception handling in `syncAccountProcessor` and `refreshTokenProcessor` with `SyncError`, preventing unhandled queue rejections.
    - Fixed `account.model.ts` pre-save validation to throw `BadRequestError` on invalid email formats.
    - Corrected accidental third-party imports of `UnauthorizedError` from `express-oauth2-jwt-bearer` in `folder.controller.ts` and `draft.controller.ts`, replacing them with `@errors`.

### Changed

- Refactored `composeEmailSchema` in `email.schema.ts` to support optional `cc`, `bcc`, `inReplyTo`, `threadId`, and `attachmentIds` using Zod 4 syntax.
- Updated `FolderRepository` data access methods to delegate error handling and logging to `FolderService`.
- Added `USER_SERVICE = 'UserService'` to `LOGGER_MODULE` enum in `observability.constants.ts`.
- Standardized error mapping and taxonomy across `EmailService`, `AccountsService`, `FolderService`, `DraftService`, `AttachmentsService`, and `AnalyticsService` to ensure centralized error middleware maps operational errors directly to RFC-compliant HTTP status codes (400, 401, 403, 404).
- Added Modifications & Enhancements (Phase 3):
    - Created `Backend/src/modules/attachments/attachment.schema.ts` defining strict Zod validation schemas (`uploadStagedAttachmentSchema`, `deleteStagedAttachmentSchema`) for attachment staging endpoints.
    - Bound validation middleware in `attachment.routes.ts` and strongly typed `AttachmentsController` handler parameters with `Request` generics.
    - Enforced `ACCOUNT_PROVIDER` enum constraint in `AccountSchema.provider` (`account.model.ts`).
    - Added compound index `{ accountId: 1, threadId: 1 }` on `EmailSchema` (`email.model.ts`) to accelerate conversation queries and thread grouping operations.
    - Optimized `EmailService.getAllEmails` to calculate `getDateRange()` once per request instead of redundant triple executions.
    - Optimized `EmailService.getAllEmails` and `getEmails` to omit heavy `body` and `bodyHtml` decompression during message list queries, reducing heap allocations and CPU latency.

## [3.2.0] - 2026-09-14

### Added

- Added Custom Exception Hierarchy (`Backend/src/core/errors/*`):
    - Standardized `ErrorCode` string enum (`ErrorCodes.ts`) replacing magic strings with compiler-enforced error codes.
    - Added typed error payload contracts (`error.types.ts`) for consistent JSON responses.
    - Implemented 11 domain-specific subclasses in `DomainErrors.ts` (`NotFoundError`, `BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`, `ValidationError`, `ProviderApiError`, `TokenExpiredError`, `RateLimitError`, `SyncError`, `ExternalServiceError`).
    - Added ergonomic error factory helpers (`ErrorFactories.ts`).
- Added Distributed Tracing & Request Logging (`Backend/src/core/observability/*`):
    - Implemented `TraceStore` using Node.js `AsyncLocalStorage` (`trace.ts`) capturing `traceId`, `userId`, `userEmail`, `userName`, and `accountId` across async call chains.
    - Added Express `traceMiddleware` parsing inbound `X-Trace-Id` or auto-generating UUID v4 and setting outbound `X-Trace-Id` response header.
    - Added `requestLoggerMiddleware` logging HTTP inbound and outbound requests with latency measurement, skipping health probes.
    - Added `setTraceContext` helper for dynamically binding authenticated user metadata to active trace contexts.
- Added Pino Structured Logging & APM Log Bridge:
    - Enhanced `logger.config.ts` with base metadata (`service`, `environment`), ISO timestamps, and dynamic mixin extracting `traceId`, `userId`, `userEmail`, `userName`, and `accountId`.
    - Created `createLogger(moduleName, options)` factory (`logger.factory.ts`) returning module-scoped loggers with non-blocking forwarding to monitoring sinks.
    - Added `LOGGER_MODULE` enum (`Backend/src/core/constants/observability.constants.ts`) standardizing module identifiers across all services, clients, and workers.
- Added Pluggable Monitoring Provider Architecture (`Backend/src/core/monitoring/*`):
    - Defined `IMonitoringProvider` strategy interface and DTO contracts (`monitoring.types.ts`).
    - Implemented `SentryMonitoringProvider` (`providers/sentry.provider.ts`) supporting Sentry Native Structured Logging (`enableLogs: true`, `Sentry.logger.*` API) and canonical `user` context modeling (`user.id`, `user.email`, `user.username`).
    - Implemented `NoopMonitoringProvider` for local/test environments.
    - Created `MonitoringManager` singleton orchestrating provider lifecycle based on `MONITORING_PROVIDER` environment configuration.
- Added Koyeb Health Probes & Readiness Checks (`Backend/src/core/health/*`):
    - Implemented `HealthService` verifying MongoDB and Redis connectivity.
    - Implemented `HealthController` handling liveness (`GET /health`) and readiness (`GET /health/ready`) checks.
    - Mounted unauthenticated health probe routes in `Backend/src/app.ts` prior to auth middleware.
- Added Worker & Background Queue Tracing:
    - Updated `BaseWorker` and `SyncWorker` to execute all BullMQ jobs within `runWithTrace()`, capturing job `traceId`, `jobId`, `userId`, and `accountId`.
    - Added `reportWorkerError()` hooks reporting worker exceptions to active monitoring providers.

### Changed

- Migrated all backend services, integration clients, background workers, processors, and bootstrap files from generic `App` logger to module-scoped `createLogger(LOGGER_MODULE.*)`.
- Updated `authMiddleware` to enrich trace store and monitoring user context upon JWT verification.
- Simplified user context handling across `sentry.provider.ts`, `auth.ts`, `sync-account.processor.ts`, `refresh-token.processor.ts`, and `base.worker.ts`: centralized active user extraction with `resolveActiveUser()`, unified auth context binding with `bindUserContext()`, and eliminated redundant manual metadata passing by relying on automatic Pino trace mixin context.
- Updated centralized `errorHandler` middleware to log domain errors with `traceId` and dispatch uncaught exceptions to active APM provider.
- Cleaned up obsolete demo modules (`Backend/src/modules/demo/*`) and deleted legacy `instruction.mjs` and `api.error.ts`.
- Removed unused `winston` dependency from `Backend/package.json`.

## [3.1.0] - 2026-08-31

### Added

- Added dedicated `analytics` backend module (`Backend/src/modules/analytics/*`).
- Added `AnalyticsRepository` with pure MongoDB aggregation pipelines for Overview KPIs, volume time-series trend, top senders, thread response turnaround time distribution, and account breakdown summaries.
- Added `AnalyticsService` orchestrating user account ownership resolution, concurrent raw query dispatch, percentage change calculations, and background snapshot refreshes.
- Added `analytics.utils.ts` for pure data transformations (`formatOverviewMetrics`, `formatEmailVolumeTimeSeries`, `formatTopSenders`, `calculateResponseTimeMetrics`, `formatAccountBreakdown`, `calculateDateRange`, `calculatePercentageChange`, `buildNoAccountsAnalyticsDashboardData`).
- Added `analytics.constants.ts` and `analytics.types.ts` centralizing folder classification identifiers and internal raw aggregation interfaces.
- Added `AnalyticsController` and Zod validation schema (`analytics.schema.ts`) mounting `GET /api/analytics/dashboard` route guarded by `authMiddleware`.
- Added automatic account metrics daily snapshot refresh on `SYSTEM_EVENT.SYNC_COMPLETED` inside `sync-completed.handler.ts`.
- Added unit and integration test suites: `analytics.utils.test.ts`, `analytics.service.test.ts`, `analytics.repository.test.ts`, and `analytics.integration.test.ts`.
- Added performance benchmark suite (`analytics.benchmark.ts`) for latency and memory SLA verification across MongoDB aggregations.

### Changed

- Updated `AccountMetricsSchema` in `account.model.ts` to track `unreadCount` and `sentCount`.
- Added compound indexes in `email.model.ts` on `{ accountId: 1, receivedAt: -1 }`, `{ accountId: 1, folders: 1, receivedAt: -1 }`, `{ accountId: 1, isRead: 1 }`, `{ accountId: 1, from: 1 }`, and `{ accountId: 1, threadId: 1, receivedAt: 1 }` for high-performance aggregation queries.

## [3.0.0] - 2026-08-29

### Added

- Added dedicated `drafts` backend module (`Backend/src/modules/drafts/*`).
- Added `DraftModel` schema (`draft.model.ts`) for local MongoDB `drafts` collection with compound indexing on `{ userId: 1, lastSavedAt: -1 }` and `{ userId: 1, accountId: 1 }`.
- Added `DraftRepository` for draft CRUD operations (`upsertDraft`, `createDraft`, `updateDraft`, `getDraftById`, `getDraftsByUserId`, `deleteDraftById`, `getDraftCountByUserId`).
- Added `DraftService` handling auto-save draft processing, HTML plain-text normalization (`htmlToText`), draft snippet generation, draft deletion, and provider email dispatch (`sendDraft`).
- Added `DraftController` and Joi validation schemas (`draft.schema.ts`).
- Added draft Express routes (`draft.routes.ts`) mounted under `/drafts` in `routes.ts`: `POST /api/drafts/save`, `GET /api/drafts`, `GET /api/drafts/:draftId`, `DELETE /api/drafts/:draftId`, and `POST /api/drafts/:draftId/send`.
- Added `POST /api/emails/move` endpoint for relocating single or bulk emails to destination folders and labels.
- Added provider strategy support for `moveEmails` across `GmailProvider` (modifying labels via `users.messages.batchModify`) and `OutlookProvider` (moving items via `/me/messages/{id}/move`).
- Added atomic MongoDB folder updates in `EmailRepository.updateFolders` using `$pull` and `$addToSet` operators.
- Added auto-resolution and deduplication of source folder IDs (`effectiveRemoveFolderIds`) in `EmailService.moveEmails` and `GmailApi.batchModifyLabels` to prevent overlap with target folder IDs.
- Added Cloudflare R2 object storage integration (`ObjectStorageService`) for attachment compose staging.
- Added `StagedAttachment` model with 24-hour TTL expiration index for auto-purging abandoned staging files.
- Added attachment routes (`POST /api/attachments/upload` and `DELETE /api/attachments/:attachmentId`).
- Added Base64URL RFC 2822 MIME message constructor (`GmailUtils.constructGmailMimeMessage`) for sending emails with attachments via Gmail API.
- Added Microsoft Graph API dual attachment dispatch in `OutlookService.sendMail` (direct inline for <= 3MB, chunked upload session for > 3MB up to 150MB).
- Added `GET /emails/thread/:emailId` to return the full conversation thread for an email.
- Added `GET /emails/attachment/:emailId/:attachmentId` to download message attachments through provider-backed retrieval.
- Added backend thread-summary aggregation support for grouped inbox and account email listing.
- Added attachment metadata persistence on emails, including filename, MIME type, size, inline state, and content ID.
- Added provider attachment retrieval support for both Gmail and Outlook integrations.

### Changed

- Updated `composeEmailWithAttachments` in `EmailService` to validate user/account authorization, stream staged attachment buffers from R2, dispatch to provider adapter, and run async post-send cleanup.
- Updated `OutlookApi.getMessageDetails` to include `$expand=attachments` query parameter so Microsoft Graph returns full attachment metadata.
- Updated email list APIs to group results by thread so mailbox listings return one entry per conversation with thread counts.
- Updated email repository query flow to use Mongo aggregation for thread grouping, per-thread counts, and chronological thread fetches.
- Updated Gmail and Outlook email parsing to capture attachment metadata during sync and detail retrieval.
- Updated email detail and thread responses to include attachment data for frontend rendering and downloads.
- Updated backend workspace and dependency metadata for the current shared package and lockfile setup.

## [2.1.1] - 2026-08-03

### Changed

- Standardized backend queue Redis configuration around a single `REDIS_URL` connection setting for BullMQ and `ioredis`.
- Updated backend package manager metadata to `pnpm@11.18.0`.

### Fixed

- Improved Redis connection compatibility for standard Redis URL-based deployments, with `SERVICE_URI` fallback support.
- Improved Redis client lifecycle handling with clearer ready/reconnect/close logging and safer shutdown behavior.

## [2.1.0] - 2026-07-31

### Added

- Added user sync-settings APIs to store global auto-sync preferences, sync mode, and shared sync interval settings.
- Added account-level sync settings updates so each connected mailbox can enable or pause background sync and adjust its interval.

### Changed

- Updated repeatable background sync scheduling to respect user-level sync preferences, including global auto-sync disable and same-for-all interval mode.
- Updated background sync worker locking to better support longer-running provider sync operations.

### Fixed

- Fixed repeatable sync scheduling so account jobs are removed when user-level auto-sync is turned off.

## [2.0.1] - 2026-07-28

### Changed

- Bumped backend package version from `1.1.0` to `2.0.1`.
- Removed the backend-local pnpm workspace override for `@mailsense/types`, leaving dependency resolution to the broader workspace/package setup.

## [2.0.0] - 2026-07-27

### Added

- Created queuing infrastructure using **BullMQ** connected to **Upstash Redis** (TCP/TLS).
- Added `QueueService.addSyncAccountJob` to queue account sync tasks with priorities.
- Added `QueueService.addRefreshTokenJob` for token-refresh background work.
- Added graceful shutdown handlers for queues and Redis connections in `src/server.ts` matching `SIGINT` and `SIGTERM`.
- Added test endpoint `POST /api/demo/queue-sync` for enqueuing sync jobs locally.
- Added Jest integration test for the `QueueService` verifying Upstash connectivity.
- Added BullMQ/Redis queue infrastructure under `Backend/src/core/queue/*` for future background account sync execution.
- Added queue lifecycle startup/shutdown hooks in server boot flow.
- Added demo endpoint support to enqueue sync-account jobs for queue testing.
- Added queue integration tests and background-sync implementation planning docs under `Backend/docs/plans/*`.
- Added a shared email provider abstraction layer under `Backend/src/integrations/email/*` for connector-agnostic mail operations.
- Added provider adapter classes for Gmail and Outlook to unify auth, sync, email actions, contact search, compose, and folder operations.
- Added provider factory unit tests covering provider selection, singleton reuse, and unsupported-provider handling.
- Added implementation planning documents for background sync phases 1 through 3 under `Backend/.agents/implementations/*`.
- Added sync-job persistence model and repository to track queued account sync execution state, trigger type, counts, and failures.
- Added background worker runtime under `Backend/src/workers/*` with a reusable base worker, sync worker, sync processor, and worker test coverage.
- Added background sync phase 4 implementation planning under `Backend/.agents/implementations/background-sync-phase-4.md`.
- Added dynamic scheduler service for repeatable account sync registration, update, and cleanup based on account activity and sync settings.
- Added scheduler service tests covering repeatable job registration, rebuild, and removal flows.
- Added token-refresh worker and refresh-token processor for background credential renewal with Redis-based locking.
- Added internal event-system bootstrap and background sync milestone publishing support for downstream subscribers.
- Added background sync phase 5 implementation planning and backend coding-standards guidance under `.agents`.
- Added workspace-linked `@mailsense/types` support to centralize backend data contracts with the frontend.

### Changed

- Configured Jest to resolve ES Module `.js` imports to `.ts` source files and map project-scoped TypeScript path aliases.
- Updated backend runtime and environment config to support Upstash Redis queue connectivity.
- Updated Jest config and package dependencies to support the new queue architecture and alias-based test resolution.
- Updated Sentry Express error-handler setup to the current SDK integration pattern.
- Refactored account OAuth callback and sync flows to use the shared provider factory instead of provider-specific branching.
- Refactored email detail retrieval, delete/archive/star/unread actions, compose flow, and contact search to execute through shared provider strategy instances.
- Refactored folder sync and folder create/update/delete flows to use provider-managed folder operations instead of direct Gmail/Outlook service wiring.
- Updated test env loading to fall back to `.env.local` when `.env.test` is not present.
- Updated Jest alias mapping to resolve `.js` imports for `@modules`, `@integrations`, and `@routes`.
- Updated ESLint rules to enforce unused import cleanup with underscore-based unused-argument exceptions.
- Renamed the lint autofix script from `lint:fix` to `lint-fix`.
- Updated accounts sync APIs to enqueue background jobs, return `202 Accepted`, and persist job IDs for manual sync requests.
- Updated account sync status typing to use shared enums for last-sync state and sync-job lifecycle state.
- Updated queue startup to initialize and manage the sync worker lifecycle alongside queue registry setup and shutdown.
- Updated queue startup to also initialize system event handlers, start the token-refresh worker, and synchronize repeatable schedulers on boot.
- Updated account connect, enable/disable, and delete flows to register or remove repeatable sync schedules automatically.
- Updated email provider contracts so Gmail and Outlook adapters expose access-token refresh capability.
- Updated sync worker processing to skip inactive or sync-disabled accounts safely instead of failing the job.
- Updated background sync processing to retry provider sync after inline token refresh on auth-expiry failures.
- Updated background sync processing to publish internal email-created and sync-completed events for downstream listeners.
- Removed the redundant numeric `id` field from newly created account payloads and account type definitions.
- Migrated backend account, email, folder, user, event, and provider contract types to the shared `@mailsense/types` package and removed duplicated local type definitions.
- Updated account onboarding so newly connected accounts are created with `syncEnabled: false` by default.
- Updated backend provider, repository, controller, and service layers to consume shared enums and payload contracts from `@mailsense/types`.
- Updated backend and workspace package configuration to resolve the shared `@mailsense/types` dependency through local pnpm overrides.

### Fixed

- Fixed a compilation mismatch with Sentry's express error handler under Express 5.
- Improved backend shutdown behavior by closing queue and Redis resources gracefully on termination signals.
- Fixed Express not-found and error-handler signatures to align with current middleware usage without unused-parameter issues.
- Improved sync-state updates by recording running, completed, and failed background job outcomes against both accounts and sync-job records.
- Improved token-refresh reliability by using a Redis lock to prevent concurrent refresh collisions for the same account.
- Added defensive ObjectId validation in account repository operations to avoid invalid-ID database lookups.
- Added startup cleanup for the stale `accounts.id_1` unique index so older databases can migrate safely after removing the numeric account ID field.

## [1.4.1] - 2026-06-29

### Added

- Added `GET /emails/filters` endpoint support to return available account and folder filter options for inbox views.

### Changed

- Updated email listing filters to support `unread` state alongside account, date-range, folder, and search filters.
- Moved shared `DATE_RANGE` usage to backend core types so email and folder filtering use the same enum source.

### Fixed

- Improved inbox filter-data consistency by sourcing account and folder filter options from active connected accounts and system folders.

## [1.4.0] - 2026-06-29

### Added

- Added backend architecture entry points under:
    - `Backend/src/core/*` for config, constants, errors, and shared backend types
    - `Backend/src/integrations/*` for Auth0, Gmail, and Outlook provider integrations
    - `Backend/src/shared/utils/*` for reusable backend utility helpers
    - `Backend/src/routes.ts` as the centralized API route registry
    - `Backend/src/middlewares/index.ts` as a barrel export for middleware access

### Changed

- Updated account listing in `AccountsService` to return all connected accounts for the user instead of filtering to only active accounts.
- Refactored backend imports and TypeScript path aliases to use the new `@config`, `@constants`, `@errors`, `@integrations`, `@types`, and `@utils` entry points.
- Moved backend configuration, constants, errors, shared types, provider clients/services, and utility helpers out of their older top-level directories into `core`, `integrations`, and `shared`.
- Updated backend app and server bootstrapping to use the new centralized route entry file and reorganized config/utilities structure.

### Fixed

- Restored backend support for account-management screens that need to display disabled accounts for re-enable flows.

### Removed

- Removed the deprecated backend directory layout for top-level `config`, `constants`, `errors`, `providers`, `types`, `utils`, and `routes/index.routes.ts` after reorganizing those concerns into the new architecture structure.

## [1.3.2] - 2026-05-31

### Changed

- Simplified the backend shared types barrel by removing the runtime export for Express typing declarations.

## [1.3.1] - 2026-05-21

### Added

- Added backend barrel export entry points for shared types and utilities:
    - `Backend/src/types/index.ts`
    - `Backend/src/utils/index.ts`
- Newly connected Gmail and Outlook accounts are now persisted with `active: true` during OAuth callback completion.

### Changed

- Standardized backend imports to consume shared `@types` and `@utils` aliases across middleware, routes, services, providers, and config modules.
- Updated backend TypeScript path aliases to resolve the new shared barrel exports.
- Updated folder service to use the shared `getDateRange` utility through the centralized utilities export.

### Fixed

- Ensured newly connected accounts are immediately included in active-account flows for account listing, sync eligibility, inbox queries, and folder queries.

## [1.3.0] - 2026-05-19

### Added

- Added JWT verification middleware using `express-oauth2-jwt-bearer`.
- Added request auth typing so controllers can read authenticated user context from `req.user` and `req.auth`.
- Added account enable/disable endpoint and request schema support.
- Added persistent `active` flag on accounts with supporting indexes.
- Added compose email endpoint support in the emails module.
- Added provider send-mail support for both Gmail and Outlook.
- Added reusable `AppError` and `AxiosApiError` classes for structured error handling.
- Added provider contact-search support for Gmail and Outlook compose flows.
- Added email search endpoint support for looking up recipient suggestions from connected provider contacts.

### Changed

- Updated accounts, users, folders, and email list/search controllers to derive the active user from the authenticated token instead of request params, query values, headers, or body fields.
- Updated accounts routes to require auth for account listing, account sync, and other protected account actions while keeping OAuth callback reachable.
- Updated user routes to authenticated session-based endpoints (`/users`, `/users/profile`, `/users/change-password`) instead of ID-based path variants.
- Updated folders and emails list request schemas to remove `userId` from request bodies.
- Updated utils routes to require authentication.
- Updated frontend account listing request to use the new authenticated accounts endpoint.
- Updated frontend axios auth token retrieval to use the client-compatible Auth0 token helper.
- Updated account queries to return only active accounts for account list, sync-all, inbox email queries, search, and folder queries.
- Updated single-account sync to block sync attempts for disabled accounts.
- Updated email service to support compose/send flows through provider-specific implementations.
- Updated inbox default filtering to exclude sent folders for Gmail and Outlook accounts.
- Consolidated API error handling into a single structured error middleware flow.
- Expanded OAuth scopes to include provider contact/people read access for compose recipient suggestions.
- Updated compose-related email service/controller/schema flow to support recipient contact search.

### Fixed

- Improved consistency between frontend and backend authenticated requests by removing duplicate client-supplied user identifiers from protected APIs.
- Improved active mailbox consistency by keeping disabled accounts out of sync and filtered mailbox results.
- Improved provider error propagation so external API failures return cleaner status/message payloads.

## [1.2.0] - 2026-04-13

### Added

- Added a new `folders` module with complete backend support:
    - Folder model and schema
    - Folder repository
    - Folder service
    - Folder controller
    - Folder routes and request schemas/types
- Added new API route group: `/folders`.
- Added Gmail labels API support in provider layer:
    - List labels
    - Get label details
    - Create label
    - Update label
    - Delete label
- Added Outlook folders API support in provider layer:
    - List folders
    - Get folder details
    - Create folder
    - Update folder
    - Delete folder
- Added Gmail label types (`GmailLabel`, `GmailLabelsListResponse`, visibility/type enums).
- Added Outlook folder types (`OutlookFolderObject`, `OutlookFoldersResponse`).
- Added provider-level mapping utilities:
    - Gmail label to unified folder metadata
    - Outlook folder to unified folder metadata
- Added provider endpoint constants:
    - `GMAIL_APIs.LABELS`
    - `OUTLOOK_APIs.FOLDERS`

### Changed

- Updated Gmail label sync flow to use batched label-detail processing via `BatchProcessor` (controlled concurrency and delay) before mapping and persistence.
- Updated Gmail and Outlook services to persist folder/label create, update, and delete operations through `FolderRepository`.
- Updated backend route registration to include folder endpoints.
- Standardized folder metadata normalization (role, kind, counts, hidden state, provider metadata) across Gmail and Outlook providers.
- Updated folder listing API to support paginated responses with account and date-range filters.
- Updated folder listing route from header-based `GET /folders/list` to validated body-based `POST /folders/list`.
- Added reusable folder list projection/sort mapping for consistent listing responses.
- Added shared date-range utilities/types for folder filtering.
- Expanded folder list projection to include `accountId` and `providerFolderId` for frontend folder actions.
- Added folder details endpoint support for fetching a single folder by ID.
- Updated account sync flow to sync folders alongside emails.
- Updated email list filtering to support folder-based email retrieval.
- Expanded email list projection to include folder data for folder-aware email views.

## [1.1.1] - 2026-03-09

### Added

- Email list projection now includes `bodyPlain` so email list responses can provide plain-text preview snippets.

## [1.1.0] - 2026-03-05

### Added

- Outlook account sync support using Microsoft Graph delta sync, including initial sync and incremental sync via stored delta cursor.
- Outlook delta-change handling to process newly added emails and remove deleted emails from local storage.
- Outlook message details fetch support (`getMessageDetails`) for full single-email retrieval from provider API.
- Outlook bulk email action support in backend service layer:
    - Delete to trash / permanent delete
    - Archive / unarchive
    - Mark unread / read
    - Flag / unflag
- Outlook Graph API helpers for message move, permanent delete, read-state updates, and flag-state updates.
- Outlook folder enum/constants for provider move operations.
- Backend developer scripts: `build:clean`, `lint:fix`, `format`, `format:check`, and `type-check`.

### Changed

- Account sync flow refactored: provider sync now runs through shared `startAccountSync` and shared sync cursor update logic.
- Outlook message ingestion now supports paginated delta retrieval and persists `@odata.deltaLink` as sync cursor.
- Email detail service behavior updated: for Outlook emails, details are fetched live from Outlook API instead of only using stored compressed body fields.
- Outlook email mapping updated to include `to`, `cc`, and `bcc` recipients more explicitly.
- Bulk upsert email repository now accepts `Partial<EmailInput>` to support provider-specific payload completeness.
- Bulk email action orchestration in `EmailService` now executes Outlook provider operations when account provider is Outlook.
- Backend dependency and tooling versions updated (including lint/type-related and core HTTP/monitoring packages).

### Fixed

- Sync metadata update (`lastSyncedAt`, `lastSyncCursor`) centralized to reduce provider-specific duplication and keep sync state updates consistent.
- Outlook incremental sync now removes emails locally when provider marks them as removed in delta response.
- Incorrect logger context labels fixed in bulk email handlers (`deleteEmail`, `archiveEmails`, `starEmails`, `unreadEmails`).
- Local DB state now stays synchronized after Outlook actions (folder/read/flag updates and provider message ID updates when move operations return a new ID).

## [1.0.0] - 2026-02-22

### Added

- Initial backend release with production-ready Gmail connector support for OAuth account linking and token handling.
- Accounts APIs for provider listing, account list/details, connect/callback flow, account deletion, and manual sync triggers.
- Email APIs for unified list, account-specific list, details, search, delete, archive, star, and unread operations.
- Gmail sync pipeline to fetch provider messages/history and persist email data in MongoDB.
- User APIs for profile fetch/update and Auth0-powered password change.
- Core backend foundations:
    - Express app + route wiring under `/api`
    - MongoDB connection + typed config/env validation
    - Request validation middleware and centralized error handling
    - Logging and API request utility layer

### Changed

- Email retrieval and list operations standardized around shared projections, filters, and pagination behavior.
- Account sync model established with sync cursor and last-synced metadata to support repeat sync cycles.
- Provider abstraction introduced so Gmail and Outlook integrations can share service patterns over time.

### Notes

- Outlook connector remained in-progress in this release and was not intended for full user rollout.

[Unreleased]: https://github.com/vishal-jagamani/mailsense/compare/v3.6.0...HEAD
[3.6.0]: https://github.com/vishal-jagamani/mailsense/compare/v3.5.0...v3.6.0
[3.5.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v3.5.0
[3.3.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v3.3.0
[3.2.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v3.2.0
[3.1.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v3.1.0
[2.1.1]: https://github.com/vishal-jagamani/mailsense/releases/tag/v2.1.1
[2.1.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v2.1.0
[2.0.1]: https://github.com/vishal-jagamani/mailsense/releases/tag/v2.0.1
[2.0.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v2.0.0
[1.4.1]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.4.1
[1.4.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.4.0
[1.3.2]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.3.2
[1.3.1]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.3.1
[1.3.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.3.0
[1.2.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.2.0
[1.1.1]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.1.1
[1.1.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.1.0
[1.0.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.0.0
