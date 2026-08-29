# Backend Changelog

All notable backend changes for MailSense are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this backend follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/vishal-jagamani/mailsense/compare/v2.1.1...HEAD
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
