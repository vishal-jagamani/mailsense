# MailSense Codebase Index

## Repo Shape

- `Backend/`: Node.js + Express + TypeScript + MongoDB
- `Frontend/`: Next.js App Router + React + TypeScript + React Query + Auth0 + Zustand

## Backend Index (`/Backend`)

### Runtime Entry

- `Backend/src/server.ts`: starts app, connects MongoDB, listens on `PORT`
- `Backend/src/app.ts`: Express app wiring (CORS, body parsers, static, routes, Sentry, centralized error handler)
- `Backend/src/routes/index.routes.ts`: mounts module routes under `/api`

### Config

- `Backend/src/config/env.ts`: validates env via Zod
- `Backend/src/config/config.ts`: exports typed config/secrets (Auth0, Gmail, Outlook, Mongo, Redis)
- `Backend/src/config/db.ts`: Mongo connect/disconnect with pooling
- `Backend/src/constants/oauth.constants.ts`: provider OAuth scopes/authorize URLs including contacts/people read scopes for compose recipient suggestions

### Middleware and Request Flow

- `Backend/src/middlewares/auth.ts`: JWT validation via Auth0 bearer-token middleware; populates `req.user`/`req.auth`
- `Backend/src/middlewares/validator.ts`: Zod request validation (`headers`, `params`, `query`, `body`)
- `Backend/src/utils/request.handler.ts`: async wrapper for controllers
- `Backend/src/middlewares/error.handler.ts`: centralized structured error responses for app/provider failures

### Modules

- Accounts (`Backend/src/modules/accounts/*`)
  - Connect/callback OAuth for Gmail/Outlook
  - Sync one/all accounts
  - Account list/details/delete
- Emails (`Backend/src/modules/emails/*`)
  - Unified list, per-account list, email details
  - Search, delete, archive, star, unread
  - Compose/send mail through Gmail and Outlook providers
  - Search recipient suggestions across connected provider contacts
  - Supports account/date/folder-based filtering
  - Uses provider APIs + DB projection/sorting
- Folders (`Backend/src/modules/folders/*`)
  - Folder sync from providers
  - Folder list/details
  - Folder create/update/delete
- Users (`Backend/src/modules/user/*`)
  - Session-scoped user/profile fetch/update
  - Change password via Auth0 Management API
- Demo (`Backend/src/modules/demo/*`)
  - Cat fact sample endpoint
- Utils route (`Backend/src/modules/utils/index.ts`)
  - Decrypt helper and account-token debug endpoint (auth protected)

### Providers

- Gmail (`Backend/src/providers/gmail/*`)
  - OAuth token exchange/refresh
  - Fetch history + messages
  - Modify labels for archive/star/unread, trash/delete
  - Label CRUD + label sync into folders
  - Send outgoing mail and upsert sent copy locally
  - Search Google other contacts for compose recipient suggestions
- Outlook (`Backend/src/providers/outlook/*`)
  - OAuth token exchange/refresh
  - Fetch profile/messages and message details
  - Delta-based sync support
  - Inbox mutation support (delete/archive/unread/flag)
  - Folder CRUD + folder sync into folders
  - Create/send outgoing mail and upsert sent copy locally
  - Search Microsoft Graph people for compose recipient suggestions
- Auth0 (`Backend/src/providers/auth0/*`)
  - Management API token + user/profile/password operations

### Data Models

- `Backend/src/modules/accounts/account.model.ts`
  - `Account`, `AccountMetrics`
- `Backend/src/modules/emails/email.model.ts`
  - `Email` with indexes on `(accountId, providerMessageId)`, date/folder access patterns
- `Backend/src/modules/folders/folder.model.ts`
  - `Folder` with provider folder identity + counts/role metadata
- `Backend/src/modules/user/user.model.ts`
  - `User` indexed by `auth0UserId`

### Shared Types / Utils

- `Backend/src/types/index.ts`: barrel export for shared backend type modules
- `Backend/src/types/express.d.ts`: extends Express request typing for validated payloads and Auth0 JWT user context
- `Backend/src/types/common.types.ts`: shared enums such as `DATE_RANGE`
- `Backend/src/utils/index.ts`: barrel export for shared backend utilities
- `Backend/src/utils/common.ts`: reusable date-range helpers
- `Backend/src/errors/AppError.ts`: base structured application error
- `Backend/src/errors/AxiosApiError.ts`: wraps provider/API failures into consistent app errors

### API Surface (mounted at `/api`)

- `GET /`
- `GET /demo/catFact`
- Users:
  - `GET /users/`
  - `PUT /users/`
  - `GET /users/profile`
  - `PUT /users/profile`
  - `PATCH /users/change-password`
- Accounts:
  - `GET /accounts/providers/list`
  - `GET /accounts/list/all`
  - `GET /accounts/:accountId`
  - `DELETE /accounts/:accountId`
  - `GET /accounts/connect/:provider`
  - `GET /accounts/callback/:provider`
  - `GET /accounts/sync-all`
  - `GET /accounts/sync/:accountId`
- Emails:
  - `POST /emails/list`
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
- `Frontend/src/app/providers.tsx`: Auth0 provider, app auth sync, React Query, theme, toaster
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
  - `entities/account/*`: account types, provider icon helpers, `AccountProviderIcon`
  - `entities/email/*`: email list/detail/search/filter request types
  - `entities/user/*`: signed-in user model
- `Frontend/src/features/*`: feature-owned UI, hooks, and data access
  - `features/accounts/*`: accounts page, provider grouping, account actions, account API layer
  - `features/auth/*`: login page and profile fetch query
  - `features/emails/*`: email details page, compose flow, delete modal, email actions, email API layer
  - `features/folders/*`: folders overview, folder email list, folder CRUD UI, folder API layer
  - `features/inbox/*`: unified inbox, account inbox, inbox filters/actions/table, inbox API layer
  - `features/settings/*`: settings page, profile/password/account-deletion UI, settings API layer
- `Frontend/src/shared/api/*`: centralized Axios clients, API endpoint constants, and query keys

### State and Data

- Zustand:
  - `Frontend/src/shared/store/auth.store.ts` auth session data (`user`, loading, authenticated flag)
  - `Frontend/src/shared/store/theme.store.ts` theme state
  - `Frontend/src/shared/store/composeEmailPopup.store.ts` compose popup open/close state
  - `Frontend/src/shared/store/index.ts` barrel export for shared Zustand stores
- Shared hooks/types:
  - `Frontend/src/shared/hooks/index.ts` barrel export for shared hooks such as `useIsMobile`, `UseDebounceQuery`, and breadcrumb reset
  - `Frontend/src/shared/types/index.ts` barrel export for shared API, folder, and settings types
  - `Frontend/src/shared/types/settings.types.ts` shared profile/settings response types
- React Query:
  - query keys in `Frontend/src/shared/api/query-keys.ts`
  - feature-level queries and mutations under `features/*/api/*.queries.ts` and `features/*/api/*.mutations.ts`
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

- `Frontend/src/shared/ui/badge.tsx`: reusable recipient chip/badge UI used in compose flow
- `Frontend/src/shared/types/sidebar.types.ts`: shared sidebar navigation item and project typing
- `Frontend/src/shared/constants/sidebar.constants.ts`: base sidebar navigation configuration
- `Frontend/src/shared/constants/email.ts`: email list pagination and date-range dropdown options backed by email entity enums

## End-to-End Flow Summary

1. User authenticates with Auth0 (frontend middleware + provider).
2. Frontend sends backend requests through `axiosClient` with bearer token header.
3. Account connect flow:
   - frontend requests `/accounts/connect/:provider`
   - redirects to provider OAuth
   - backend callback stores encrypted tokens and triggers sync
4. Connected Accounts page loads all linked accounts, including disabled ones, so users can review and re-enable them from account-management UI.
5. Inbox UI reads paginated email data and performs mutation actions (delete/archive/star/unread).
6. Folders UI reads paginated folder data, supports folder CRUD, and opens filtered email lists for a selected folder.
7. Compose popup lets the user send email from a connected account; backend sends through the provider and stores the sent message for later listing/details.
8. Compose recipient search uses provider contacts/people APIs to suggest and add recipients as chips while typing.
9. Sidebar navigation builds connected account inbox entries dynamically from the fetched account list while preserving direct navigation to parent sections.
10. Background sync and mailbox views still limit operational flows to active accounts only.

## Important Notes

- Backend and frontend both now use barrel exports for shared types/utilities/hooks/stores to reduce deep relative imports.
- Frontend has two base URL definitions:
  - `Frontend/src/config/config.ts` uses `NEXT_PUBLIC_API_BASE_URL`
  - `Frontend/src/shared/constants/urls.ts` uses `NEXT_PUBLIC_API_URL` fallback `http://localhost:4000`
- Backend auth middleware now validates Auth0 JWTs for protected routes.
- Backend now uses structured app/provider error classes for cleaner API error responses.
- Outlook backend sync and inbox mutations are implemented; frontend release availability may still be controlled by product rollout.
- Protected backend APIs now resolve user context from the signed-in session instead of client-supplied user IDs.
- Newly connected accounts are persisted as active, so they appear immediately in active-account-driven flows after OAuth completion.
- Connected Accounts now intentionally includes disabled accounts for management/re-enable workflows, while sync and inbox flows remain active-account-only.
- Shared sidebar/navigation structure is now defined in centralized constants and types instead of inline component-local data.
- Frontend account/auth/email/inbox/folders/settings code is fully migrated from the deprecated `modules/*` directory into `entities/*`, `features/*`, and `shared/api/*` (with the `src/modules` directory removed entirely).
- Release changelog is maintained in `CHANGELOG.md` and should stay user-facing (avoid internal refactor/tooling-only notes).
