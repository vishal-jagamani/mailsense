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
- Outlook (`Backend/src/providers/outlook/*`)
  - OAuth token exchange/refresh
  - Fetch profile/messages and message details
  - Delta-based sync support
  - Inbox mutation support (delete/archive/unread/flag)
  - Folder CRUD + folder sync into folders
  - Create/send outgoing mail and upsert sent copy locally
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
- `Backend/src/types/express.d.ts`: extends Express request typing for validated payloads and Auth0 JWT user context
- `Backend/src/types/common.types.ts`: shared enums such as `DATE_RANGE`
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
- `Frontend/src/app/(home)/accounts/page.tsx`: account connect/manage page
- `Frontend/src/app/(home)/settings/[setting]/page.tsx`: settings page

### Feature Modules
- `Frontend/src/modules/inbox/*`: unified inbox UI + search/filter/pagination
- `Frontend/src/modules/home/*`: list/delete APIs and reusable email table
- `Frontend/src/modules/emails/*`: email details, star/unread, and compose email popup/editor
- `Frontend/src/modules/folders/*`: folders overview, folder filters, create/rename/delete actions, folder email list
- `Frontend/src/modules/accounts/*`: providers list, connect flow, account actions
- `Frontend/src/modules/settings/*`: profile and password changes
- `Frontend/src/modules/auth/*`: profile fetch via app `/auth` routes

### State and Data
- Zustand:
  - `Frontend/src/store/auth.store.ts` auth session data (`user`, loading, authenticated flag)
  - `Frontend/src/shared/store/composeEmailPopup.store.ts` compose popup open/close state
- React Query:
  - query keys in `Frontend/src/shared/config/query-keys.ts`
  - module-level hooks under each `modules/*/services/use*.ts`
- Axios clients:
  - `Frontend/src/shared/config/axios.ts`
  - `axiosClient` -> backend API base URL + Auth0 client-side bearer token injection
  - `auth0ApiClient` -> frontend `/auth/*` routes

### Backend API Endpoint Constants in Frontend
- Accounts: `Frontend/src/modules/accounts/constants/api.constants.ts`
- Emails: `Frontend/src/modules/emails/constants/api.constants.ts`
- Folders: `Frontend/src/modules/folders/constants/api.constants.ts`
- Home/inbox list/delete: `Frontend/src/modules/home/constants/api.constants.ts`
- Inbox search: `Frontend/src/modules/inbox/constants/api.constants.ts`

## End-to-End Flow Summary
1. User authenticates with Auth0 (frontend middleware + provider).
2. Frontend sends backend requests through `axiosClient` with bearer token header.
3. Account connect flow:
   - frontend requests `/accounts/connect/:provider`
   - redirects to provider OAuth
   - backend callback stores encrypted tokens and triggers sync
4. Account sync pulls emails and folders from Gmail/Outlook APIs, transforms provider payloads, and upserts Mongo docs.
5. Inbox UI reads paginated email data and performs mutation actions (delete/archive/star/unread).
6. Folders UI reads paginated folder data, supports folder CRUD, and opens filtered email lists for a selected folder.
7. Compose popup lets the user send email from a connected account; backend sends through the provider and stores the sent message for later listing/details.

## Important Notes
- Frontend has two base URL definitions:
  - `Frontend/src/config/config.ts` uses `NEXT_PUBLIC_API_BASE_URL`
  - `Frontend/src/shared/constants/urls.ts` uses `NEXT_PUBLIC_API_URL` fallback `http://localhost:4000`
- Backend auth middleware now validates Auth0 JWTs for protected routes.
- Backend now uses structured app/provider error classes for cleaner API error responses.
- Outlook backend sync and inbox mutations are implemented; frontend release availability may still be controlled by product rollout.
- Protected backend APIs now resolve user context from the signed-in session instead of client-supplied user IDs.
- Release changelog is maintained in `CHANGELOG.md` and should stay user-facing (avoid internal refactor/tooling-only notes).
