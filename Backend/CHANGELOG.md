# Backend Changelog

All notable backend changes for MailSense are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this backend follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Created queuing infrastructure using **BullMQ** connected to **Upstash Redis** (TCP/TLS).
- Added `QueueService.addSyncAccountJob` to queue account sync tasks with priorities.
- Added graceful shutdown handlers for queues and Redis connections in `src/server.ts` matching `SIGINT` and `SIGTERM`.
- Added test endpoint `POST /api/demo/queue-sync` for enqueuing sync jobs locally.
- Added Jest integration test for the `QueueService` verifying Upstash connectivity.

### Changed
- Configured Jest to resolve ES Module `.js` imports to `.ts` source files and map project-scoped TypeScript path aliases.
- Fixed a compilation mismatch with Sentry's express error handler under Express 5.

## [1.4.1] - 2026-06-29

### Added
- Added `GET /emails/filters` endpoint support to return available account and folder filter options for inbox views.
- Added BullMQ/Redis queue infrastructure under `Backend/src/core/queue/*` for future background account sync execution.
- Added queue lifecycle startup/shutdown hooks in server boot flow.
- Added demo endpoint support to enqueue sync-account jobs for queue testing.
- Added queue integration tests and background-sync implementation planning docs under `Backend/docs/plans/*`.

### Changed
- Updated email listing filters to support `unread` state alongside account, date-range, folder, and search filters.
- Moved shared `DATE_RANGE` usage to backend core types so email and folder filtering use the same enum source.
- Updated backend runtime and environment config to support Upstash Redis queue connectivity.
- Updated Jest config and package dependencies to support the new queue architecture and alias-based test resolution.
- Updated Sentry Express error-handler setup to the current SDK integration pattern.

### Fixed
- Improved inbox filter-data consistency by sourcing account and folder filter options from active connected accounts and system folders.
- Improved backend shutdown behavior by closing queue and Redis resources gracefully on termination signals.

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

[Unreleased]: https://github.com/vishal-jagamani/mailsense/compare/v1.4.0...HEAD
[1.4.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.4.0
[1.3.2]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.3.2
[1.3.1]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.3.1
[1.3.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.3.0
[1.2.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.2.0
[1.1.1]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.1.1
[1.1.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.1.0
[1.0.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.0.0
