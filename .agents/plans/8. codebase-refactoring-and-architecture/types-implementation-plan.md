# Codebase Refactoring & Architecture Types — Overview & Contract Changes

> **Target Version:** `@mailsense/types` `v1.6.0`
> **Status:** COMPLETED
> **Created:** 2026-09-27 · **Last Updated:** 2026-10-15


---

## 1. Overview

### Problem Statement

The MailSense platform has completed its **v1.2.0 Deep Structural & Refactoring Health Audit** ([v1.2.0 Audit Report](file:///Users/vishaljagamani/Projects/Projects/mailsense/.agents/plans/codebase-health-audit-report.md)). The audit surfaced multiple type-system gaps and strict-typing violations across shared contracts:

1. **Ambiguous Recipient Union Type (`BUG-V12-08`):** In [`emails.interfaces.ts`](file:///Users/vishaljagamani/Projects/Projects/mailsense-types/src/emails/emails.interfaces.ts), `EmailAttributes.to`, `cc`, and `bcc` are defined as `string[] | string`. This union forces every consuming service, controller, and frontend component to perform defensive `Array.isArray()` checks or risk string manipulation bugs (e.g., `.map()` crashes on raw strings).
2. **Inline Object Type Violations (`BUG-V12-09`):** Across email actions and account mutations, function parameters and hook options currently use inline object types (e.g. `{ emailIds: string[]; star: boolean }`, `{ emailIds: string[]; unread: boolean }`). This violates the zero-inline-types mandate.
3. **Sensitive Token Exposure in Account List Contracts (`BUG-V12-05`):** The `GetAccountsResponse` contract currently wraps `AccountAttributes[]`, which includes encrypted `accessToken` and `refreshToken` fields. It must be updated to return `SanitizedAccountAttributes[]`.
4. **Missing Request DTOs (`BUG-V12-04`):** The `updateAccountSettings` endpoint lacks a dedicated typed request contract for sync settings updates.

### Goals

- Normalize `EmailAttributes.to`, `cc`, and `bcc` strictly to `string[]`.
- Introduce canonical, reusable action parameter interfaces (`EmailMoveParams`, `EmailStarParams`, `EmailUnreadParams`, `EmailDeleteParams`, `EmailArchiveParams`) to eliminate inline types across frontend and backend.
- Define `UpdateAccountSettingsRequest` and update `GetAccountsResponse` to consume `SanitizedAccountAttributes`.
- Define `ConfigurationError` metadata types for infrastructure startup validation.
- Bump `@mailsense/types` to `v1.6.0` with full backward compatibility.

---

## 2. Types to Add & Modify

### 2.1 Component: `src/emails/emails.interfaces.ts`

#### [MODIFY] `EmailAttributes` (Phase 2)
#### [NEW] `EmailMoveParams` (Phase 2)
#### [NEW] `EmailStarParams` (Phase 2)
#### [NEW] `EmailUnreadParams` (Phase 2)
#### [NEW] `EmailDeleteParams` (Phase 2)
#### [NEW] `EmailArchiveParams` (Phase 2)
#### [NEW] `PerAccountActionContext` (Phase 4)

```typescript
import { BaseEntity, DATE_RANGE, Filter } from '../common/index.js';

// DB entities
export interface EmailAttributes extends BaseEntity {
    accountId: string;
    providerMessageId: string;
    threadId: string;
    threadCount?: number;
    from: string;
    to: string[]; // Phase 2 (BUG-V12-08: Normalized from string[] | string)
    cc: string[]; // Phase 2 (BUG-V12-08: Normalized from string[] | string)
    bcc: string[]; // Phase 2 (BUG-V12-08: Normalized from string[] | string)
    subject: string;
    body: string;
    bodyHtml: string;
    bodyPlain: string;
    receivedAt: Date;
    isRead: boolean;
    folders: string[];
    attachments?: EmailAttachment[];
}

export interface EmailAttachment {
    attachmentId: string;
    filename: string;
    mimeType: string;
    size: number;
    contentId?: string;
    isInline: boolean;
}

// Lightweight Email summary DTO for list views
export interface EmailListDTO extends BaseEntity {
    subject?: string | undefined;
    from?: string | undefined;
    receivedAt?: Date | undefined;
    isRead?: boolean | undefined;
    providerMessageId?: string | undefined;
    accountId?: string | undefined;
    threadId?: string | undefined;
    folders?: string[] | undefined;
    to?: string[] | undefined; // Normalized to string[]
    cc?: string[] | undefined; // Normalized to string[]
    bcc?: string[] | undefined; // Normalized to string[]
    hasAttachments?: boolean | undefined;
}

// Phase 2 (BUG-V12-09: Reusable action parameter interfaces eliminating inline types)
export interface EmailMoveParams {
    emailIds: string[];
    targetFolderId: string;
    accountId?: string;
}

export interface EmailStarParams {
    emailIds: string[];
    star: boolean;
}

export interface EmailUnreadParams {
    emailIds: string[];
    unread: boolean;
}

export interface EmailDeleteParams {
    emailIds: string[];
}

export interface EmailArchiveParams {
    emailIds: string[];
}

// Phase 4 (REFACTOR-BE-02: Structured context for per-account batch actions)
export interface PerAccountActionContext {
    accountId: string;
    emailIds: string[];
    providerMessageIds: string[];
}
```

---

### 2.2 Component: `src/accounts/accounts.interfaces.ts`

#### [MODIFY] `GetAccountsResponse` (Phase 2)
#### [NEW] `UpdateAccountSettingsRequest` (Phase 2)

```typescript
import { BaseEntity } from '../common/index.js';
import { IEmailTUserProfile } from '../providers/provider.interfaces.js';
import { ACCOUNT_LAST_SYNC_STATUS, ACCOUNT_PROVIDER, ACCOUNT_SYNC_JOB_STATUS, ACCOUNT_SYNC_JOB_TRIGGER_TYPE } from './accounts.enums.js';

// Display metadata for connected account providers
export interface AccountProviderType {
    id: number;
    name: string;
    displayName: string;
}

// Main Account entity model and DTO representation
export interface AccountAttributes extends BaseEntity {
    userId: string;
    provider: ACCOUNT_PROVIDER;
    emailAddress: string;
    userProfileDetails: IEmailTUserProfile;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiry: number;
    refreshTokenExpiry: number;
    scope: string;
    syncEnabled: boolean;
    syncInterval: number;
    lastSyncedAt: number;
    lastSyncCursor?: string | undefined;
    active: boolean;
    syncInProgress?: boolean | undefined;
    lastSyncStatus?: ACCOUNT_LAST_SYNC_STATUS | undefined;
    lastSyncError?: string | undefined;
    lastSyncStartedAt?: number | undefined;
    lastSyncCompletedAt?: number | undefined;
}

// Metrics and counters tracked for an account
export interface AccountMetricsAttributes extends BaseEntity {
    accountId: string;
    totalEmails: number;
    totalThreads: number;
    totalLabels: number;
    totalFolders: number;
    totalContacts: number;
    unreadCount?: number;
    sentCount?: number;
    date: Date;
}

// Execution record for queued background account sync jobs
export interface SyncJobAttributes extends BaseEntity {
    accountId: string;
    bullJobId: string;
    status: ACCOUNT_SYNC_JOB_STATUS;
    triggerType: ACCOUNT_SYNC_JOB_TRIGGER_TYPE;
    startedAt: number;
    completedAt?: number | undefined;
    addedEmailsCount: number;
    deletedEmailsCount: number;
    errorMessage?: string | undefined;
    errorStack?: string | undefined;
}

// Sanitized Account entity representation (safe for public API responses)
export interface SanitizedAccountAttributes extends BaseEntity {
    userId: string;
    email: string;
    name?: string;
    provider: ACCOUNT_PROVIDER;
    isEnabled: boolean;
    lastSyncedAt?: Date;
    lastSyncStatus?: ACCOUNT_LAST_SYNC_STATUS;
    syncFrequency?: string;
    syncHistory?: SyncJobAttributes[];
    metrics?: AccountMetricsAttributes;
}

// Phase 2 (BUG-V12-05: Return SanitizedAccountAttributes instead of raw AccountAttributes)
export interface GetAccountsResponse {
    data: SanitizedAccountAttributes[];
}

export interface AccountDetailsResponse {
    account: SanitizedAccountAttributes;
}

// Phase 2 (BUG-V12-04 & BUG-V12-09: Request DTO for updating account settings)
export interface UpdateAccountSettingsRequest {
    syncEnabled?: boolean;
    syncInterval?: number;
}

// OAuth authorization callback query parameters
export interface OAuthCallbackParams {
    code: string;
    state: string;
}
```

---

### 2.3 Component: `src/common/common.interfaces.ts`

#### [NEW] `ConfigurationErrorContext` (Phase 2)

```typescript
// Phase 2 (EXC-V12-01 & EXC-V12-02: Structured context for configuration failures)
export interface ConfigurationErrorContext {
    variableName: string;
    component: string;
    expectedFormat?: string;
}
```

---

## 3. Package Version & CHANGELOG.md Update

### Package Version

```json
{
  "name": "@mailsense/types",
  "version": "1.6.0"
}
```

### `mailsense-types/CHANGELOG.md` Snippet

```markdown
## [1.6.0] - 2026-09-27

### Added
- `EmailMoveParams`, `EmailStarParams`, `EmailUnreadParams`, `EmailDeleteParams`, `EmailArchiveParams` action interfaces in `src/emails/emails.interfaces.ts` eliminating inline object types.
- `PerAccountActionContext` in `src/emails/emails.interfaces.ts` for batch multi-account processing.
- `UpdateAccountSettingsRequest` in `src/accounts/accounts.interfaces.ts` for account settings mutations.
- `ConfigurationErrorContext` in `src/common/common.interfaces.ts` for typed infrastructure configuration error reporting.

### Changed
- `EmailAttributes.to`, `cc`, and `bcc` normalized strictly to `string[]` (previously `string[] | string`), eliminating ambiguous union branches.
- `EmailListDTO.to`, `cc`, and `bcc` normalized strictly to `string[]`.
- `GetAccountsResponse.data` updated to return `SanitizedAccountAttributes[]` instead of `AccountAttributes[]` to prevent leaking encrypted token metadata.
```

---

## 4. Build & Local Testing Steps

```bash
# 1. Build @mailsense/types
cd /Users/vishaljagamani/Projects/Projects/mailsense-types
pnpm build

# 2. Sync distribution bundle to Backend & Frontend
cp -r /Users/vishaljagamani/Projects/Projects/mailsense-types/dist/* /Users/vishaljagamani/Projects/Projects/mailsense/Frontend/node_modules/@mailsense/types/dist/
cp -r /Users/vishaljagamani/Projects/Projects/mailsense-types/dist/* /Users/vishaljagamani/Projects/Projects/mailsense/Backend/node_modules/@mailsense/types/dist/

# 3. Verify Backend type checks
cd /Users/vishaljagamani/Projects/Projects/mailsense/Backend
pnpm build

# 4. Verify Frontend type checks
cd /Users/vishaljagamani/Projects/Projects/mailsense/Frontend
npx tsc --noEmit
```
