# MailSense Frontend Background Sync: Phased Implementation Plan

This document outlines the sequential phases and checklists for implementing the frontend background sync system, centralized account settings, and supporting backend API alignments.

---

## Roadmap Overview

The implementation is broken down into five sequential, testable phases.

| Phase | Title | Core Focus |
|---|---|---|
| **Phase 1** | Backend Settings Schemas & Dynamic Schedulers | Extend `User` schema with `syncSettings`, add global and per-account settings API endpoints, and update `SchedulerService` in BullMQ. |
| **Phase 2** | Frontend Entity Types & Query Polling | Extend [account.types.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/entities/account/model/account.types.ts) and add TanStack Query auto-polling triggers in [accounts.queries.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/accounts/api/accounts.queries.ts). |
| **Phase 3** | Centralized Account Settings Tab (`/settings/account`) | Enable tabs in Settings page [index.tsx](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/settings/pages/index.tsx) and build `AccountSyncSettings` page with global auto-sync and mode selectors. |
| **Phase 4** | Card Quick Action & UI Polish (`/accounts`) | Build [AccountSettingsModal.tsx](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/accounts/components/account-card/AccountSettingsModal.tsx), update [useAccountCardActions.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/accounts/hooks/useAccountCardActions.ts), and add gear icon to [AccountCardActionButtons.tsx](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/accounts/components/account-card/AccountCardActionButtons.tsx). |
| **Phase 5** | Inbox Real-Time Refresh | Enable 10s polling for emails in [useInboxPage.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/inbox/hooks/useInboxPage.ts) during background sync and render progress banner in [index.tsx](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/inbox/pages/index.tsx). |

---

## Detailed Phases

### Phase 1: Backend Settings Schemas & Dynamic Schedulers
* **Objective**: Add `syncSettings` schema attributes to the Backend `User` model, create API endpoints for global user sync settings and individual account settings, and wire `SchedulerService` for bulk or per-account BullMQ job rescheduling.

#### Implementation Checklist
- [ ] **Database Schema Updates**:
  - Add `syncSettings` sub-document to `UserSchema` in [user.model.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/user/user.model.ts) (`globalAutoSync`, `syncMode`, `globalSyncInterval`, `defaultSyncInterval`).
- [ ] **Global User Settings Endpoints**:
  - Add `getUserSyncSettings` and `updateUserSyncSettings` in [user.service.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/user/user.service.ts).
  - Expose `GET /api/user/sync-settings` and `PATCH /api/user/sync-settings` in [user.routes.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/user/user.routes.ts).
- [ ] **Account Settings Endpoint**:
  - Add `updateAccountSettingsSchema` in [account.schema.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/accounts/account.schema.ts).
  - Register route `PATCH /api/accounts/settings/:accountId` in [account.routes.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/accounts/account.routes.ts).
- [ ] **Scheduler Integration**:
  - Update `SchedulerService` to remove all user jobs if `globalAutoSync: false` or bulk-update intervals if `syncMode: 'SAME_FOR_ALL'`.

#### Files to Modify
* `Backend/src/modules/user/user.model.ts`
* `Backend/src/modules/user/user.types.ts`
* `Backend/src/modules/user/user.service.ts`
* `Backend/src/modules/user/user.controller.ts`
* `Backend/src/modules/user/user.routes.ts`
* `Backend/src/modules/accounts/account.schema.ts`
* `Backend/src/modules/accounts/account.service.ts`
* `Backend/src/modules/accounts/account.controller.ts`
* `Backend/src/modules/accounts/account.routes.ts`
* `Backend/src/core/queue/scheduler.service.ts`

#### Acceptance Criteria
1. `PATCH /api/user/sync-settings` updates MongoDB and updates BullMQ schedulers.
2. `PATCH /api/accounts/settings/:accountId` updates individual account intervals and reschedules BullMQ repeatable jobs.

---

### Phase 2: Frontend Entity Types & Query Polling
* **Objective**: Define frontend sync settings interfaces and configure automatic React Query polling on the account list while sync tasks run.

#### Implementation Checklist
- [ ] Update `AccountAttributes` in [account.types.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/entities/account/model/account.types.ts) to include `syncInProgress`, `lastSyncStatus`, `lastSyncError`, `lastSyncStartedAt`, `lastSyncCompletedAt`.
- [ ] Add `UserSyncSettings` and `UpdateUserSyncSettingsPayload` interfaces in [account.types.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/entities/account/model/account.types.ts).
- [ ] Update `useGetAccountsQuery` in [accounts.queries.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/accounts/api/accounts.queries.ts) to use a dynamic `refetchInterval` (3s polling when any account has `syncInProgress === true`, `false` otherwise).
- [ ] Update `useGetAccountDetailsQuery` in [accounts.queries.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/accounts/api/accounts.queries.ts) with similar polling logic.

#### Files to Modify
* [account.types.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/entities/account/model/account.types.ts)
* [accounts.queries.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/accounts/api/accounts.queries.ts)

#### Acceptance Criteria
1. Codebase compiles with clean TypeScript types.
2. React Query auto-polls every 3 seconds while background syncs are running.

---

### Phase 3: Centralized Account Settings Tab (`/settings/account`)
* **Objective**: Build the dedicated Account Sync Settings page inside the `/settings` route with global auto-sync controls, mode selection, and a connected account overview table.

#### Implementation Checklist
- [ ] Update [settings.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/shared/constants/settings.ts) to ensure the Account tab option is active.
- [ ] Update Settings page [index.tsx](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/settings/pages/index.tsx) to render Radix `Tabs` for switching between **Profile** and **Account Settings**.
- [ ] Create `settings.api.ts` and `settings.queries.ts` under `src/features/settings/api/` for user sync settings operations.
- [ ] Create `AccountSyncSettings.tsx` in `src/features/settings/pages/account/`:
  - **Global Sync Card**: Global Auto-Sync switch, Sync Mode radio selector (`SAME_FOR_ALL` vs `CUSTOM_PER_ACCOUNT`), Global Sync Interval select dropdown.
  - **Account Sync Overview List**: Table listing each account with auto-sync switch, interval dropdown, status badge, and manual sync action.

#### Files to Create / Modify
* **Files to Create**:
  - `src/features/settings/api/settings.api.ts`
  - `src/features/settings/api/settings.queries.ts`
  - `src/features/settings/pages/account/index.tsx`
* **Files to Modify**:
  - [settings.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/shared/constants/settings.ts)
  - [index.tsx (Settings Page)](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/settings/pages/index.tsx)

#### Acceptance Criteria
1. `/settings` page displays tab navigation for Profile and Account.
2. Toggling Global Auto-Sync or changing Sync Mode saves updates via API and updates connected account controls seamlessly.

---

### Phase 4: Card Quick Action & UI Polish (`/accounts`)
* **Objective**: Add quick-access account settings via a gear icon modal on account cards, with spinning sync indicators and error context tooltips.

#### Implementation Checklist
- [ ] Create `AccountSettingsModal.tsx` in `src/features/accounts/components/account-card/`:
  - Modal with switches for `syncEnabled` and `active`, and dropdown for `syncInterval`.
- [ ] Refactor [useAccountCardActions.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/accounts/hooks/useAccountCardActions.ts):
  - Expose modal handlers and calculate `isSyncingAccount` from `account.syncInProgress`.
- [ ] Update [AccountCardActionButtons.tsx](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/accounts/components/account-card/AccountCardActionButtons.tsx):
  - Add **Settings** gear icon button opening `AccountSettingsModal`.
  - Animate `RefreshCw` spin icon while `account.syncInProgress === true`.
  - Show warning icon with Radix Tooltip containing `account.lastSyncError` if status is `FAILED`.

#### Files to Create / Modify
* **Files to Create**:
  - `src/features/accounts/components/account-card/AccountSettingsModal.tsx`
* **Files to Modify**:
  - [useAccountCardActions.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/accounts/hooks/useAccountCardActions.ts)
  - [AccountCardActionButtons.tsx](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/accounts/components/account-card/AccountCardActionButtons.tsx)

#### Acceptance Criteria
1. Gear icon on account cards opens the quick settings modal.
2. Saving changes updates MongoDB and reschedules the BullMQ repeatable job.

---

### Phase 5: Inbox Real-Time Refresh & Progress Banner
* **Objective**: Automatically refresh emails in the inbox during active syncs and display a visual status banner.

#### Implementation Checklist
- [ ] Update [useInboxPage.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/inbox/hooks/useInboxPage.ts):
  - Check if any account is syncing and set `isSyncingInProgress`.
  - Refetch emails every 10 seconds while `isSyncingInProgress` is active.
- [ ] Update [index.tsx](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/inbox/pages/index.tsx):
  - Render top warning banner under header while syncing is active: *"Syncing your inbox... new emails will load automatically."*

#### Files to Modify
* [useInboxPage.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/inbox/hooks/useInboxPage.ts)
* [index.tsx](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/inbox/pages/index.tsx)

#### Acceptance Criteria
1. Inbox page displays active sync banner when background jobs are processing.
2. Emails update automatically without requiring manual browser reloads.
