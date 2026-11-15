# MailSense Frontend Background Sync: Master Implementation Plan

This document outlines the comprehensive architectural design, UI/UX specifications, and file-level modifications required across the Next.js Frontend and Express Backend to support the asynchronous background synchronization pipeline and dynamic Account Sync Settings (Global & Per-Account controls).

---

## 1. Goal & Objectives

### Purpose
With the backend background sync engine using BullMQ complete, API requests to trigger synchronization (`/api/accounts/sync/:accountId` and `/api/accounts/sync-all`) return a `202 Accepted` status immediately. The application requires:
1. A **centralized Account Sync Settings system** allowing users to manage global auto-sync, sync modes (Same for all vs. Custom per account), and individual sync frequencies.
2. A **reactive, non-blocking UI** with automated TanStack Query polling, real-time inbox refresh, spinning progress indicators, and rich error context tooltips.

### Architectural & UX Objectives
1. **Centralized Sync Settings (`/settings/account`)**:
   - **Global Auto-Sync Switch**: One master toggle (`globalAutoSync`) to pause/resume background syncs across all connected accounts.
   - **Sync Mode Control (`syncMode`)**: 
     - `SAME_FOR_ALL`: Applies a single global sync interval (e.g., every 15 mins) to all user accounts.
     - `CUSTOM_PER_ACCOUNT`: Allows setting individual sync intervals and auto-sync toggles per account (e.g., Gmail Work = 5m, Outlook Personal = 30m).
   - **Default Interval for New Accounts**: Configurable baseline interval when connecting new OAuth accounts.
   - **Account Sync Overview List**: A unified management card displaying all connected accounts with their specific auto-sync switches, interval dropdowns, last synced time, and live status badges.
2. **Quick Account Settings (`/accounts` page)**:
   - A gear icon button on each account card opening a lightweight `AccountSettingsModal` for quick adjustments without navigating away.
3. **Instant Response & Non-blocking UI**:
   - `202 Accepted` queue triggers resolve instantly in UI without locking buttons in long mutation spinners.
4. **Reactive Progress Indicators & Polling**:
   - Automatic 3-second polling on account lists while any account has `syncInProgress === true`.
   - Automatic 10-second inbox email refetching and status banner during active background syncs.

---

## 2. Architecture & Design Decisions

### 1. Account Sync Settings Architecture (Hybrid Approach)

Based on industry best practices (Superhuman, Shortwave, Outlook Web) and MailSense feature specifications (`features-list.md` Item 10), we adopt a **Hybrid Settings Architecture**:

```
                              ┌─────────────────────────────────────────┐
                              │        User Account Sync Settings        │
                              └────────────────────┬────────────────────┘
                                                   │
                   ┌───────────────────────────────┴───────────────────────────────┐
                   ▼                                                               ▼
┌──────────────────────────────────────┐                       ┌──────────────────────────────────────┐
│ Centralized Settings Tab             │                       │ Account Card Quick Settings Modal    │
│ Route: /settings/account             │                       │ Route: /accounts (Gear Icon)         │
├──────────────────────────────────────┤                       ├──────────────────────────────────────┤
│ • Master Global Auto-Sync Switch     │                       │ • Per-Account Auto-Sync Switch       │
│ • Sync Mode: SAME_FOR_ALL / CUSTOM   │                       │ • Per-Account Sync Interval Dropdown │
│ • Global Default Sync Interval       │                       │ • Live Sync Status & Last Synced     │
│ • Full Accounts Management Table     │                       └──────────────────────────────────────┘
└──────────────────────────────────────┘
```

#### Why Hybrid is Best:
- **Centralized Control**: Users with multiple accounts can turn off auto-sync globally or set all accounts to sync every 15 minutes with a single click under `/settings/account`.
- **Granular Flexibility**: Power users who want different intervals (Work = 5m, Personal = 60m) can select `CUSTOM_PER_ACCOUNT` and tune each mailbox.
- **Contextual Convenience**: Users on the `/accounts` page can tweak settings via the gear icon on the card without leaving their current view.

---

### 2. Backend Data Schema & BullMQ Rescheduling

#### A. Dedicated `UserSettings` Schema & `@mailsense/types` Alignment
To ensure single-responsibility and clean separation of concerns, the **`User` MongoDB collection contains only user profile and auth details** (`auth0UserId`, `name`, `email`).

All user settings are persisted in a **dedicated `UserSettings` MongoDB collection** (`usersettings`), linked via `userId: string` with a unique index.

Common contracts in `@mailsense/types`:
```typescript
import { BaseEntity } from '../common/common.interfaces.js';
import { ACCOUNT_SYNC_MODE } from './user.enums.js';

export interface UserAccountSyncSettings {
    globalAutoSync: boolean;
    syncMode: ACCOUNT_SYNC_MODE; // SAME_FOR_ALL | CUSTOM_PER_ACCOUNT
    globalSyncInterval: number; // in minutes (5, 10, 15, 30, 60, 360, 720, 1440)
    defaultSyncInterval: number; // in minutes
}

export interface UserAccountSettings {
    syncSettings: UserAccountSyncSettings;
    // Future additions: defaultAccountId?, emailSignature?, etc.
}

export interface UserSettings extends BaseEntity {
    userId: string;
    account: UserAccountSettings;
    // Future additions: appearance?: UserAppearanceSettings, privacy?: UserPrivacySettings, etc.
}
```

#### B. Unified REST API Endpoints (`/api/user/settings`)
Instead of single-feature endpoints (`/api/user/sync-settings`), we expose a **unified User Settings REST API**:
- **`GET /api/user/settings`**: Retrieves the `UserSettings` document for the authenticated user from the `UserSettings` collection.
- **`PATCH /api/user/settings`**: Accepts deep partial updates (e.g., `{ account: { syncSettings: { globalAutoSync: false } } }`). Updates the `UserSettings` collection and triggers BullMQ rescheduling when `account.syncSettings` is modified.

#### C. Account Document (`Account` Model / `AccountAttributes`)
Per-account settings & execution status sourced from `AccountAttributes` in `@mailsense/types`:
```typescript
import { ACCOUNT_LAST_SYNC_STATUS } from '@mailsense/types';

syncEnabled: boolean;
syncInterval: number; // in minutes
active: boolean;
syncInProgress?: boolean;
lastSyncStatus?: ACCOUNT_LAST_SYNC_STATUS; // PENDING | SUCCESS | FAILED
lastSyncError?: string;
lastSyncStartedAt?: number;
lastSyncCompletedAt?: number;
```

#### D. Rescheduling Execution Flow
1. When **Global Auto-Sync** is toggled `false` via `PATCH /api/user/settings`:
   - Backend calls `SchedulerService.removeAllUserRepeatableJobs(userId)` to remove all BullMQ repeatable jobs for the user's accounts.
2. When **Sync Mode** is set to `SAME_FOR_ALL` with interval `X`:
   - Backend updates all accounts of the user to `syncInterval = X`.
   - Calls `SchedulerService.upsertAccountRepeatableJob(accountId)` for each account to update BullMQ job schedulers.
3. When an **Individual Account Setting** is updated (`PATCH /api/accounts/settings/:accountId`):
   - Backend updates the `Account` document.
   - Calls `SchedulerService.upsertAccountRepeatableJob(accountId)`, which replaces the previous repeatable schedule in BullMQ with the new interval.

---

### 3. Dynamic Polling via TanStack Query

In [accounts.queries.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/accounts/api/accounts.queries.ts), `useGetAccountsQuery` implements a dynamic `refetchInterval`:
```typescript
import { AccountAttributes } from '@mailsense/types';

refetchInterval: (query) => {
    const data = query.state.data as AccountAttributes[] | undefined;
    if (Array.isArray(data) && data.some((acc) => acc.syncInProgress)) {
        return 3000; // Poll every 3 seconds while background worker runs
    }
    return false; // Stop polling once sync completes
}
```

---

## 3. Proposed Changes & File-Level Plan

### Component: Shared Types Package (`@mailsense/types`)

#### [MODIFY] Shared Types (`@mailsense/types`)
* Export `UserSettings`, `UserAccountSettings`, `UserAccountSyncSettings`, `ACCOUNT_SYNC_MODE` enum, and settings response payload DTOs from `@mailsense/types` for direct consumption by both `Frontend` and `Backend`.

---

### Component: Backend Modules

#### [MODIFY] [user.model.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/user/user.model.ts) & [NEW] [user-settings.model.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/user/user-settings.model.ts)
* `user.model.ts`: Keep `UserSchema` focused strictly on user identity and auth details (`auth0UserId`, `name`, `email`).
* `user-settings.model.ts`: Create dedicated `UserSettings` Mongoose model (`usersettings` collection) linked by `userId`:
```typescript
const UserSettingsSchema = new Schema<UserSettingsDocument>(
    {
        userId: { type: String, required: true, index: true, unique: true },
        account: { type: UserAccountSettingsSchema, default: () => ({}) },
    },
    { timestamps: true, versionKey: false },
);

export const UserSettingsModel = model<UserSettingsDocument>('UserSettings', UserSettingsSchema);
```

#### [MODIFY] [user.routes.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/user/user.routes.ts) & [user.controller.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/user/user.controller.ts)
* Expose `GET /api/user/settings` to fetch full user settings object.
* Expose `PATCH /api/user/settings` to handle partial updates for user settings (including `account.syncSettings`) and trigger `SchedulerService` sync.

#### [MODIFY] [account.schema.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/accounts/account.schema.ts), [account.routes.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/accounts/account.routes.ts) & [account.service.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/accounts/account.service.ts)
* Add `PATCH /api/accounts/settings/:accountId` endpoint to update individual account `syncEnabled`, `syncInterval`, and `active` state, invoking `SchedulerService.upsertAccountRepeatableJob`.

---

### Component: Frontend Entities Layer

#### [MODIFY] [account.types.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/entities/account/model/account.types.ts)
* Re-export `AccountAttributes`, `UserSettings`, `UserAccountSyncSettings`, `ACCOUNT_SYNC_MODE`, and `ACCOUNT_LAST_SYNC_STATUS` directly from `@mailsense/types` instead of redefining local duplicated types.

---

### Component: Frontend Settings Feature Layer

#### [MODIFY] [settings.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/shared/constants/settings.ts)
* Ensure `SETTINGS_OPTIONS` includes the **Account** settings tab (`/settings/account`).

#### [MODIFY] [index.tsx (Settings Page)](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/settings/pages/index.tsx)
* Render Radix `Tabs` UI for switching between **Profile** (`/settings/profile`) and **Account Sync** (`/settings/account`).

#### [NEW] [AccountSyncSettings.tsx](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/settings/pages/account/index.tsx)
* Main page component for `/settings/account` featuring:
  - **Global Sync Configuration Card**: Switches for `globalAutoSync`, radio group for `syncMode` (`SAME_FOR_ALL` vs `CUSTOM_PER_ACCOUNT`), dropdown for `globalSyncInterval`.
  - **Connected Accounts Management Table/Card**: Rows for each account with provider icon, email, `syncEnabled` switch, `syncInterval` dropdown, last synced time, and manual sync trigger button.

#### [NEW] [settings.api.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/settings/api/settings.api.ts) & [settings.queries.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/settings/api/settings.queries.ts)
* API client functions and TanStack Query hooks for `getUserSettings` (`GET /api/user/settings`) and `useUpdateUserSettingsMutation` (`PATCH /api/user/settings`).

---

### Component: Frontend Accounts Feature Layer

#### [MODIFY] [accounts.api.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/accounts/api/accounts.api.ts) & [accounts.mutations.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/accounts/api/accounts.mutations.ts)
* Add `updateAccountSettings` endpoint call and `useUpdateAccountSettingsMutation`.

#### [NEW] [AccountSettingsModal.tsx](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/accounts/components/account-card/AccountSettingsModal.tsx)
* Modal dialog for editing an individual account's settings directly from the account card on `/accounts`.

#### [MODIFY] [useAccountCardActions.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/accounts/hooks/useAccountCardActions.ts)
* Expose settings modal open state and handlers. Calculate `isSyncingAccount` from `account.syncInProgress`.

#### [MODIFY] [AccountCardActionButtons.tsx](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/accounts/components/account-card/AccountCardActionButtons.tsx)
* Add **Settings** gear icon button.
* Animate `RefreshCw` spin icon when `account.syncInProgress === true`.
* Render failure icon with Radix Tooltip containing `account.lastSyncError` if status is `FAILED`.

---

### Component: Frontend Inbox Feature Layer

#### [MODIFY] [useInboxPage.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/inbox/hooks/useInboxPage.ts) & [index.tsx](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/inbox/pages/index.tsx)
* Refetch emails every 10s while any active account is syncing and render an active sync banner under the inbox header.

---

## 4. Verification Plan

### Automated Tests
* Run `pnpm lint` and `pnpm tsc` in Backend and Frontend workspace roots.
* Verify backend unit tests for `SchedulerService.upsertAccountRepeatableJob` when switching between `SAME_FOR_ALL` and `CUSTOM_PER_ACCOUNT` modes.

### Manual Verification
1. **Global Sync Settings (`/settings/account`)**:
   - Toggle Global Auto-Sync OFF -> Verify all BullMQ repeatable jobs are removed.
   - Switch Sync Mode to `SAME_FOR_ALL` (15 mins) -> Verify all account intervals update to 15m and BullMQ schedules update.
2. **Individual Account Settings (`/accounts` Gear Icon)**:
   - Click gear icon on an account card -> Open `AccountSettingsModal` -> Change interval to 5m -> Verify account updates and backend reschedules BullMQ job.
3. **Background Sync Flow**:
   - Trigger manual sync -> Verify 202 response, spinning icon, 3-second account polling, 10-second inbox polling, and clean completion.
