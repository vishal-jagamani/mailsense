# MailSense Codebase Index

## Repo Shape

- `Backend/`: Node.js + Express + TypeScript + MongoDB
- `Frontend/`: Next.js App Router + React + TypeScript + React Query + Auth0 + Zustand
- Shared contracts are sourced from `@mailsense/types`, with local workspace/package-manager config present in both `Backend/` and `Frontend/`.

## Backend Index (`/Backend`)

### Runtime Entry

- `Backend/src/server.ts`: starts app, connects MongoDB, listens on `PORT`
- `Backend/src/app.ts`: Express app wiring (CORS, body parsers, static, routes, Sentry, centralized error handler)
- `Backend/src/routes.ts`: mounts module routes under `/api`

### Config

- `Backend/src/core/config/env.config.ts`: validates env via Zod
- `Backend/src/core/config/app.config.ts`: exports typed app secrets/config (Auth0, Gmail, Outlook, Mongo, Redis)
- `Backend/src/core/config/db.config.ts`: Mongo connect/disconnect with pooling
- `Backend/src/core/config/db.config.ts`: drops the stale `accounts.id_1` unique index during startup when migrating older databases
- `Backend/src/core/config/logger.config.ts`: logger configuration
- `Backend/src/core/config/app.config.ts`: now also exposes Upstash Redis REST-backed queue connection config
- `Backend/src/core/config/env.config.ts`: falls back to `.env.local` during tests when `.env.test` is not available
- `Backend/src/core/constants/oauth.constants.ts`: provider OAuth scopes/authorize URLs including contacts/people read scopes for compose recipient suggestions
- `Backend/package.json`: backend package metadata is currently on the `2.0.1` release line

### Queue Infrastructure

- `Backend/src/core/queue/*`: BullMQ/Redis queue bootstrap, queue registry, queue service, and graceful shutdown handling
  - `queue.config.ts`: queue names and default retry/backoff behavior, including token-refresh queue registration
  - `queue.registry.ts`: queue instance initialization/caching and cleanup
  - `queue.service.ts`: job enqueue helpers for sync-account and refresh-token submission
  - `redis.connection.ts`: shared Upstash Redis connection for queue processing
  - `scheduler.service.ts`: synchronizes BullMQ repeatable sync schedules with active/sync-enabled account settings and user-level sync preferences
  - `index.ts`: queue startup/shutdown hooks used by the server lifecycle, including event bootstrap, worker startup, scheduler sync, and teardown
- `Backend/src/core/queue/__tests__/queue.service.test.ts`: queue integration coverage for sync job enqueue flow
- `Backend/src/core/queue/__tests__/scheduler.service.test.ts`: scheduler coverage for repeatable sync job registration and cleanup

### Events

- `Backend/src/core/events/*`: internal event bus and event handlers for background sync milestones
  - `event-bus.ts`: typed event emitter wrapper with safe subscriber execution and sanitized logging, now powered by shared event contracts from `@mailsense/types`
  - `handlers/email-created.handler.ts`: subscriber hook for newly indexed email events
  - `handlers/sync-completed.handler.ts`: subscriber hook for sync completion events
  - `index.ts`: system-event initialization entry point used during background jobs startup
- `Backend/src/core/events/__tests__/event-bus.test.ts`: event bus coverage for publish/subscribe behavior and subscriber error isolation

### Workers

- `Backend/src/workers/base.worker.ts`: reusable BullMQ worker base with startup, shutdown, and lifecycle event hooks
- `Backend/src/workers/sync.worker.ts`: sync-account queue worker that updates sync-job/account status on active, completed, and failed events
- `Backend/src/workers/processors/sync-account.processor.ts`: executes provider-based folder sync and incremental/full email sync inside background jobs
- `Backend/src/workers/token-refresh.worker.ts`: worker for refresh-token queue processing
- `Backend/src/workers/processors/refresh-token.processor.ts`: refreshes provider access tokens with per-account Redis locking
- `Backend/src/workers/worker.types.ts`: shared worker result types
- `Backend/src/workers/__tests__/sync.worker.test.ts`: coverage for incremental and full background sync processor flows

### Middleware and Request Flow

- `Backend/src/middlewares/index.ts`: barrel export for backend middleware
- `Backend/src/middlewares/auth.ts`: JWT validation via Auth0 bearer-token middleware; populates `req.user`/`req.auth`
- `Backend/src/middlewares/validator.ts`: Zod request validation (`headers`, `params`, `query`, `body`)
- `Backend/src/shared/utils/request.handler.ts`: async wrapper for controllers
- `Backend/src/middlewares/error.handler.ts`: centralized structured error responses for app/provider failures

### Modules

- Accounts (`Backend/src/modules/accounts/*`)
  - Connect/callback OAuth for Gmail/Outlook
  - Sync one/all accounts
  - Account list/details/delete
  - Account-level sync settings update endpoint for `syncEnabled`, `syncInterval`, and related scheduler refresh
  - Provider callback token exchange, profile fetch, and sync execution now route through `EmailProviderFactory`
  - Sync requests now enqueue background jobs and persist sync-job tracking records
  - Account activation, deactivation, creation, and deletion now synchronize repeatable background sync schedules
  - Newly connected accounts are now created as active but with `syncEnabled: false` by default
- Emails (`Backend/src/modules/emails/*`)
  - Unified list, per-account list, email details
  - Search, delete, archive, star, unread
  - Compose/send mail through Gmail and Outlook providers
  - Search recipient suggestions across connected provider contacts
  - Supports account/date/folder-based filtering
  - Uses provider APIs + DB projection/sorting
  - Provider-specific email details and mail actions now dispatch through shared provider strategy instances
- Folders (`Backend/src/modules/folders/*`)
  - Folder sync from providers
  - Folder list/details
  - Folder create/update/delete
  - Folder sync and CRUD now dispatch through shared provider strategy instances
- Users (`Backend/src/modules/user/*`)
  - Session-scoped user/profile fetch/update
  - Change password via Auth0 Management API
  - User sync settings fetch/update endpoints for global account background-sync preferences
- Demo (`Backend/src/modules/demo/*`)
  - Cat fact sample endpoint
  - Queue-sync demo endpoint for manually enqueuing sync-account jobs
- Utils route (`Backend/src/modules/utils/index.ts`)
  - Decrypt helper and account-token debug endpoint (auth protected)

### Integrations

- Email provider abstraction (`Backend/src/integrations/email/*`)
  - `email.provider.ts`: shared provider contract for OAuth, token refresh, sync, email actions, compose, contact search, and folder CRUD
  - `email.provider.factory.ts`: provider selector and singleton cache for Gmail and Outlook adapters
  - `email.provider.types.ts`: shared auth/profile/send-result types used by provider implementations
  - `__tests__/provider.factory.test.ts`: factory coverage for provider selection and singleton behavior
- Gmail (`Backend/src/integrations/gmail/*`)
  - OAuth token exchange/refresh
  - Fetch history + messages
  - Modify labels for archive/star/unread, trash/delete
  - Label CRUD + label sync into folders
  - Send outgoing mail and upsert sent copy locally
  - Search Google other contacts for compose recipient suggestions
  - `gmail.provider.ts`: adapts Gmail service capabilities to the shared provider contract, including token refresh via stored refresh token
- Outlook (`Backend/src/integrations/outlook/*`)
  - OAuth token exchange/refresh
  - Fetch profile/messages and message details
  - Delta-based sync support
  - Inbox mutation support (delete/archive/unread/flag)
  - Folder CRUD + folder sync into folders
  - Create/send outgoing mail and upsert sent copy locally
  - Search Microsoft Graph people for compose recipient suggestions
  - `outlook.provider.ts`: adapts Outlook service capabilities to the shared provider contract, including access-token refresh
- Auth0 (`Backend/src/integrations/auth0/*`)
  - Management API token + user/profile/password operations

### Data Models

- `Backend/src/modules/accounts/account.model.ts`
  - `Account`, `AccountMetrics`
- `Backend/src/modules/accounts/sync-job.model.ts`
  - `SyncJob` for queued account-sync lifecycle tracking
- `Backend/src/modules/emails/email.model.ts`
  - `Email` with indexes on `(accountId, providerMessageId)`, date/folder access patterns
- `Backend/src/modules/folders/folder.model.ts`
  - `Folder` with provider folder identity + counts/role metadata
- `Backend/src/modules/user/user.model.ts`
  - `User` indexed by `auth0UserId`
  - `UserSettingsModel` for persisted account sync preferences per user

### Shared Types / Utils

- `Backend/src/core/types/express.d.ts`: extends Express request typing for validated payloads and Auth0 JWT user context
- Backend module and integration contracts are now sourced from `@mailsense/types` instead of local duplicated type definition files
- `Backend/src/shared/utils/index.ts`: barrel export for shared backend utilities
- `Backend/src/shared/utils/common.ts`: reusable date-range helpers
- `Backend/src/core/errors/AppError.ts`: base structured application error
- `Backend/src/core/errors/AxiosApiError.ts`: wraps provider/API failures into consistent app errors
- `Backend/src/modules/accounts/account.types.ts`: backend-local Mongo projection mappings that remain after moving shared contracts to `@mailsense/types`

### API Surface (mounted at `/api`)

- `GET /`
- `GET /demo/catFact`
- Users:
  - `GET /users/`
  - `PUT /users/`
  - `GET /users/profile`
  - `PUT /users/profile`
  - `PATCH /users/change-password`
  - `GET /users/settings`
  - `PATCH /users/settings`
- Accounts:
  - `GET /accounts/providers/list`
  - `GET /accounts/list/all`
  - `GET /accounts/:accountId`
  - `DELETE /accounts/:accountId`
  - `PATCH /accounts/settings/:accountId`
  - `GET /accounts/connect/:provider`
  - `GET /accounts/callback/:provider`
  - `GET /accounts/sync-all`
  - `GET /accounts/sync/:accountId`
- Emails:
  - `POST /emails/list`
  - `GET /emails/filters`
  - `GET /emails/list/:accountId`
  - `GET /emails/details/:emailId`
  - `POST /emails/search`
  - `POST /emails/compose`
  - `POST /emails/searchOtherContacts`
  - `POST /emails/delete`
  - `POST /emails/archive`
  - `POST /emails/star`
  - `POST /emails/unread`
- Folders:
  - `GET /folders/sync/:accountId`
  - `POST /folders/`
  - `GET /folders/:folderId`
  - `PATCH /folders/:folderId`
  - `DELETE /folders/:folderId`
  - `POST /folders/list`
  - `GET /folders/list/:accountId`
- Utils:
  - `POST /utils/decrypt`
  - `GET /utils/getAccountAccessToken`

## Frontend Index (`/Frontend`)

### Runtime Entry

- `Frontend/src/app/layout.tsx`: root layout + providers
- `Frontend/src/shared/providers/index.tsx`: Centralized application providers wrapper (Auth0, custom AuthProvider, React Query, theme, toaster)
- `Frontend/src/middleware.ts`: route protection via Auth0 session (redirect unauthenticated to `/get_started`)
- `Frontend/src/app/(home)/layout.tsx`: authenticated shell with sidebar, breadcrumb, and global compose-email popup

### App Router Pages

- `Frontend/src/app/(home)/page.tsx`: redirects to `/inbox`
- `Frontend/src/app/(home)/inbox/page.tsx`: unified inbox page
- `Frontend/src/app/(home)/inbox/[account]/page.tsx`: account inbox page
- `Frontend/src/app/(home)/inbox/[account]/email/[email]/page.tsx`: email details page
- `Frontend/src/app/(home)/folders/page.tsx`: folders overview page
- `Frontend/src/app/(home)/folders/[folder]/page.tsx`: folder-specific email list page
- `Frontend/src/app/(home)/accounts/page.tsx`: account connect/manage page via `@features/accounts/pages`
- `Frontend/src/app/(home)/settings/[setting]/page.tsx`: settings page
- `Frontend/src/app/get_started/page.tsx`: auth entry page via `@features/auth/pages`

### Frontend Architecture

- `Frontend/src/entities/*`: domain entities and shared domain UI/types
  - `entities/account/*`: provider display metadata, provider icon helpers, `AccountProviderIcon`
  - `entities/email/*`: email formatting helpers and email UI utilities
  - `entities/folder/*`: folder UI component state/interfaces that remain frontend-specific
  - Account, email, folder, user, filter, and settings data contracts now come from `@mailsense/types`
- `Frontend/src/features/*`: feature-owned UI, hooks, and data access
  - `features/accounts/*`: accounts page, provider grouping, account actions, account sync settings modal, account API layer
  - `features/auth/*`: login page and profile fetch query
  - `features/emails/*`: email details page, compose flow, rich-text editor, delete modal, email actions, email API layer
  - `features/folders/*`: folders overview, folder email list, folder CRUD UI, folder API layer, folder action hooks
  - `features/inbox/*`: unified inbox, account inbox, shared inbox header, inbox filters/actions/table, inbox API layer, inbox page hooks with sync-aware refresh behavior
  - `features/settings/*`: settings page tabs, profile page/form, account sync settings page, password modal, account-deletion UI, settings API layer
- `Frontend/src/shared/api/*`: centralized Axios clients, API endpoint constants, and query keys
- `Frontend/next.config.ts`: transpiles the shared `@mailsense/types` package for Next.js consumption
- `Frontend/pnpm-workspace.yaml`: links `@mailsense/types` from the local workspace

### State and Data

- Zustand:
  - `Frontend/src/shared/store/auth.store.ts` auth session data (`user`, loading, authenticated flag)
  - `Frontend/src/shared/store/theme.store.ts` theme state
  - `Frontend/src/shared/store/composeEmailPopup.store.ts` compose popup open/close state
  - `Frontend/src/shared/store/index.ts` barrel export for shared Zustand stores
- Shared hooks/types:
  - `Frontend/src/shared/hooks/index.ts` barrel export for shared hooks such as `useIsMobile`, `UseDebounceQuery`, and breadcrumb reset
  - `Frontend/src/shared/types/index.ts` barrel export for shared API, settings, and filter types
  - `Frontend/src/shared/types/filter.types.ts` filter model types and option structures
  - `Frontend/src/shared/types/settings.types.ts` shared profile/settings response types
- React Query:
  - query keys in `Frontend/src/shared/api/query-keys.ts`
  - includes `USER_SYNC_SETTINGS` for account background-sync preferences
  - feature-level queries and mutations under `features/*/api/*.queries.ts`, `features/*/api/*.mutation.ts`, and `features/*/api/*.mutations.ts`
- Axios clients:
  - `Frontend/src/shared/api/client.ts`
  - `axiosClient` -> backend API base URL + Auth0 client-side bearer token injection
  - `auth0ApiClient` -> frontend `/auth/*` routes

### Backend API Endpoint Constants in Frontend

- Accounts: `Frontend/src/shared/api/endpoints.ts`
- Auth: `Frontend/src/shared/api/endpoints.ts`
- Emails: `Frontend/src/shared/api/endpoints.ts`
- Folders: `Frontend/src/shared/api/endpoints.ts`
- Inbox search/list actions: `Frontend/src/shared/api/endpoints.ts`
- Settings: `Frontend/src/shared/api/endpoints.ts`

### Shared UI / Types

- `Frontend/src/shared/components/utils/FilterModal.tsx`: reusable filter modal component used in folders and inbox list views, including folder and unread filters for inbox
- `Frontend/src/shared/ui/badge.tsx`: reusable recipient chip/badge UI used in compose flow
- `Frontend/src/shared/types/sidebar.types.ts`: shared sidebar navigation item and project typing
- `Frontend/src/shared/constants/sidebar.constants.ts`: base sidebar navigation configuration
- `Frontend/src/shared/constants/email.ts`: email list pagination and date-range dropdown options backed by email entity enums
- `Frontend/src/shared/api/endpoints.ts`: centralized Auth0 route helpers and backend endpoint constants, including account sync-settings and user settings endpoints

## End-to-End Flow Summary

1. User authenticates with Auth0 (frontend middleware + provider).
2. Frontend sends backend requests through `axiosClient` with bearer token header.
3. Account connect flow:
   - frontend requests `/accounts/connect/:provider`
   - redirects to provider OAuth
   - backend callback stores encrypted tokens and triggers sync
4. Connected Accounts page loads all linked accounts, including disabled ones, so users can review and re-enable them from account-management UI.
5. Inbox UI reads paginated email data and performs mutation actions (delete/archive/star/unread).
   - available filter options are fetched from `GET /emails/filters`
   - filters can include account, folder, date range, search text, and unread state
6. Folders UI reads paginated folder data, supports folder CRUD, and opens filtered email lists for a selected folder.
7. Compose popup lets the user send email from a connected account; backend sends through the provider and stores the sent message for later listing/details.
8. Compose recipient search uses provider contacts/people APIs to suggest and add recipients as chips while typing.
9. Sidebar navigation builds connected account inbox entries dynamically from the fetched account list while preserving direct navigation to parent sections.
10. Background sync and mailbox views still limit operational flows to active accounts only.
11. Backend now includes queue infrastructure for future asynchronous account-sync execution, with Redis-backed job enqueue support and graceful queue shutdown handling.

## Important Notes

- Backend and frontend both now use barrel exports for shared types/utilities/hooks/stores to reduce deep relative imports.
- Backend architecture now separates core concerns into `core/*`, third-party provider integrations into `integrations/*`, and reusable helpers into `shared/utils/*`.
- Backend queue infrastructure now lives under `Backend/src/core/queue/*` and is configured for BullMQ with Upstash Redis connectivity.
- Frontend runtime API base URL and Auth0 route helpers are now centralized in `Frontend/src/shared/api/endpoints.ts`.
- Backend auth middleware now validates Auth0 JWTs for protected routes.
- Backend now uses structured app/provider error classes for cleaner API error responses.
- Outlook backend sync and inbox mutations are implemented; frontend release availability may still be controlled by product rollout.
- Protected backend APIs now resolve user context from the signed-in session instead of client-supplied user IDs.
- Newly connected accounts are persisted as active, so they appear immediately in active-account-driven flows after OAuth completion.
- Connected Accounts now intentionally includes disabled accounts for management/re-enable workflows, while sync and inbox flows remain active-account-only.
- Shared sidebar/navigation structure is now defined in centralized constants and types instead of inline component-local data.
- Frontend account/auth/email/inbox/folders/settings code is fully migrated from the deprecated `modules/*` directory into `entities/*`, `features/*`, and `shared/api/*` (with the `src/modules` directory removed entirely).
- Release changelog is maintained in `CHANGELOG.md` and should stay user-facing (avoid internal refactor/tooling-only notes).
- Centralized `FilterModal` component is introduced under `@shared/components/utils` to unify the filter logic/UI for both inbox lists and folders overview.
