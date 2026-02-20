# MailSense Codebase Index

## Repo Shape
- `Backend/`: Node.js + Express + TypeScript + MongoDB
- `Frontend/`: Next.js App Router + React + TypeScript + React Query + Auth0 + Zustand

## Backend Index (`/Backend`)

### Runtime Entry
- `Backend/src/server.ts`: starts app, connects MongoDB, listens on `PORT`
- `Backend/src/app.ts`: Express app wiring (CORS, body parsers, static, routes, error handlers)
- `Backend/src/routes/index.routes.ts`: mounts module routes under `/api`

### Config
- `Backend/src/config/env.ts`: validates env via Zod
- `Backend/src/config/config.ts`: exports typed config/secrets (Auth0, Gmail, Outlook, Mongo, Redis)
- `Backend/src/config/db.ts`: Mongo connect/disconnect with pooling

### Middleware and Request Flow
- `Backend/src/middlewares/auth.ts`: bearer-token presence check (verification TODO)
- `Backend/src/middlewares/validator.ts`: Zod request validation (`headers`, `params`, `query`, `body`)
- `Backend/src/utils/request.handler.ts`: async wrapper for controllers
- `Backend/src/middlewares/error.handler.ts`: operational + global error responses

### Modules
- Accounts (`Backend/src/modules/accounts/*`)
  - Connect/callback OAuth for Gmail/Outlook
  - Sync one/all accounts
  - Account CRUD
- Emails (`Backend/src/modules/emails/*`)
  - Unified list, per-account list, email details
  - Search, delete, archive, star, unread
  - Uses provider APIs + DB projection/sorting
- Users (`Backend/src/modules/user/*`)
  - Profile fetch/update
  - Change password via Auth0 Management API
- Demo (`Backend/src/modules/demo/*`)
  - Cat fact sample endpoint
- Utils route (`Backend/src/modules/utils/index.ts`)
  - Decrypt helper and account-token debug endpoint

### Providers
- Gmail (`Backend/src/providers/gmail/*`)
  - OAuth token exchange/refresh
  - Fetch history + messages
  - Modify labels for archive/star/unread, trash/delete
- Outlook (`Backend/src/providers/outlook/*`)
  - OAuth token exchange/refresh
  - Fetch profile/messages
  - Sync/mutations are less complete than Gmail
- Auth0 (`Backend/src/providers/auth0/*`)
  - Management API token + user/profile/password operations

### Data Models
- `Backend/src/modules/accounts/account.model.ts`
  - `Account`, `AccountMetrics`
- `Backend/src/modules/emails/email.model.ts`
  - `Email` with indexes on `(accountId, providerMessageId)`, date/folder access patterns
- `Backend/src/modules/user/user.model.ts`
  - `User` indexed by `auth0UserId`

### API Surface (mounted at `/api`)
- `GET /`
- `GET /demo/catFact`
- Users:
  - `GET /users/:id`
  - `PUT /users/:id`
  - `GET /users/:id/profile`
  - `PUT /users/:id/profile`
  - `PATCH /users/:id/change-password`
- Accounts:
  - `GET /accounts/providers/list`
  - `GET /accounts/list/:userId`
  - `GET /accounts/:accountId`
  - `DELETE /accounts/:accountId`
  - `GET /accounts/connect/:provider`
  - `GET /accounts/callback/:provider`
  - `GET /accounts/sync`
  - `GET /accounts/sync/:accountId`
- Emails:
  - `POST /emails/list`
  - `GET /emails/list/:accountId`
  - `GET /emails/details/:emailId`
  - `POST /emails/search`
  - `POST /emails/delete`
  - `POST /emails/archive`
  - `POST /emails/star`
  - `POST /emails/unread`
- Utils:
  - `POST /utils/decrypt`
  - `GET /utils/getAccountAccessToken`

## Frontend Index (`/Frontend`)

### Runtime Entry
- `Frontend/src/app/layout.tsx`: root layout + providers
- `Frontend/src/app/providers.tsx`: Auth0 provider, app auth sync, React Query, theme, toaster
- `Frontend/src/middleware.ts`: route protection via Auth0 session (redirect unauthenticated to `/get_started`)

### App Router Pages
- `Frontend/src/app/(home)/page.tsx`: redirects to `/inbox`
- `Frontend/src/app/(home)/inbox/page.tsx`: unified inbox page
- `Frontend/src/app/(home)/inbox/[account]/page.tsx`: account inbox page
- `Frontend/src/app/(home)/inbox/[account]/email/[email]/page.tsx`: email details page
- `Frontend/src/app/(home)/accounts/page.tsx`: account connect/manage page
- `Frontend/src/app/(home)/settings/[setting]/page.tsx`: settings page

### Feature Modules
- `Frontend/src/modules/inbox/*`: unified inbox UI + search/filter/pagination
- `Frontend/src/modules/home/*`: list/delete APIs and reusable email table
- `Frontend/src/modules/emails/*`: email details + star/unread
- `Frontend/src/modules/accounts/*`: providers list, connect flow, account actions
- `Frontend/src/modules/settings/*`: profile and password changes
- `Frontend/src/modules/auth/*`: profile fetch via app `/auth` routes

### State and Data
- Zustand:
  - `Frontend/src/store/auth.store.ts` auth session data (`user`, loading, authenticated flag)
- React Query:
  - query keys in `Frontend/src/shared/config/query-keys.ts`
  - module-level hooks under each `modules/*/services/use*.ts`
- Axios clients:
  - `Frontend/src/shared/config/axios.ts`
  - `axiosClient` -> backend API base URL
  - `auth0ApiClient` -> frontend `/auth/*` routes

### Backend API Endpoint Constants in Frontend
- Accounts: `Frontend/src/modules/accounts/constants/api.constants.ts`
- Emails: `Frontend/src/modules/emails/constants/api.constants.ts`
- Home/inbox list/delete: `Frontend/src/modules/home/constants/api.constants.ts`
- Inbox search: `Frontend/src/modules/inbox/constants/api.constants.ts`

## End-to-End Flow Summary
1. User authenticates with Auth0 (frontend middleware + provider).
2. Frontend sends backend requests through `axiosClient` with bearer token header.
3. Account connect flow:
   - frontend requests `/accounts/connect/:provider`
   - redirects to provider OAuth
   - backend callback stores encrypted tokens and triggers sync
4. Sync pulls emails from Gmail/Outlook APIs, transforms/compresses content, upserts Mongo docs.
5. Inbox UI reads paginated email data and performs mutation actions (delete/archive/star/unread).

## Important Notes
- Frontend has two base URL definitions:
  - `Frontend/src/config/config.ts` uses `NEXT_PUBLIC_API_BASE_URL`
  - `Frontend/src/shared/constants/urls.ts` uses `NEXT_PUBLIC_API_URL` fallback `http://localhost:4000`
- Backend auth middleware currently checks only token presence; token verification is marked TODO.
- Outlook integration exists but mutation/sync parity is lower than Gmail.
