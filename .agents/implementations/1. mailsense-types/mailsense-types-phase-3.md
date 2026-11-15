# Phase 3 Implementation Guide: Core Domain Modules (`accounts`, `emails`, `folders`, `user`)

## Overview

This document provides the exact source code definitions, file locations, exports, and verification steps for **Phase 3: Core Domain Modules (`accounts`, `emails`, `folders`, `user`)** of the `@mailsense/types` library.

---

## 1. Directory Structure for Phase 3

```
src/
├── accounts/
│   ├── accounts.constants.ts
│   ├── accounts.enums.ts
│   ├── accounts.interfaces.ts
│   ├── accounts.types.ts
│   └── index.ts
├── emails/
│   ├── emails.constants.ts
│   ├── emails.enums.ts
│   ├── emails.interfaces.ts
│   ├── emails.types.ts
│   └── index.ts
├── folders/
│   ├── folders.constants.ts
│   ├── folders.enums.ts
│   ├── folders.interfaces.ts
│   ├── folders.types.ts
│   └── index.ts
└── user/
    ├── user.constants.ts
    ├── user.enums.ts
    ├── user.interfaces.ts
    ├── user.types.ts
    └── index.ts
```

---

## 2. File Specifications & Exact Implementation Code

### 2.1 Module: `accounts` (`src/accounts/`)

#### `accounts.enums.ts`
Location: `src/accounts/accounts.enums.ts`

```typescript
// Supported email provider types
export enum AccountProvider {
    GMAIL = 'gmail',
    OUTLOOK = 'outlook',
}

// Status of the last background account synchronization
export enum ACCOUNT_LAST_SYNC_STATUS {
    PENDING = 'PENDING',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
}

// Lifecycle status of queued account sync background jobs
export enum ACCOUNT_SYNC_JOB_STATUS {
    PENDING = 'PENDING',
    RUNNING = 'RUNNING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

// Trigger source for background account sync jobs
export enum ACCOUNT_SYNC_JOB_TRIGGER_TYPE {
    MANUAL = 'MANUAL',
    SCHEDULED = 'SCHEDULED',
}
```

#### `accounts.interfaces.ts`
Location: `src/accounts/accounts.interfaces.ts`

```typescript
import { ACCOUNT_LAST_SYNC_STATUS, ACCOUNT_SYNC_JOB_STATUS, ACCOUNT_SYNC_JOB_TRIGGER_TYPE, AccountProvider } from './accounts.enums.js';

// Display metadata for connected account providers
export interface AccountProviderType {
    id: number;
    name: string;
    displayName: string;
}

// Main Account entity model and DTO representation
export interface AccountAttributes {
    _id?: string | undefined;
    id?: number | undefined;
    userId: string;
    provider: AccountProvider | string;
    emailAddress: string;
    userProfileDetails: Record<string, unknown>;
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
export interface AccountMetricsAttributes {
    accountId: string;
    totalEmails: number;
    totalThreads: number;
    totalLabels: number;
    totalFolders: number;
    totalContacts: number;
    date: Date;
}

// Execution record for queued background account sync jobs
export interface SyncJobAttributes {
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

// API response wrapper for accounts list
export interface GetAccountsResponse {
    data: AccountAttributes[];
}

// Google OAuth authorization callback query parameters
export interface GmailOAuthCallbackParams {
    code: string;
}

// Google OAuth access token exchange response payload
export interface GmailOAuthAccessTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
}

// Outlook OAuth authorization callback query parameters
export interface OutlookOAuthCallbackParams {
    code: string;
}

// Outlook OAuth access token exchange response payload
export interface OutlookOAuthAccessTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    ext_expires_in: number;
    refresh_token: string;
    scope: string;
}
```

#### `accounts.constants.ts`
Location: `src/accounts/accounts.constants.ts`

```typescript
import { AccountProvider } from './accounts.enums.js';
import { AccountProviderType } from './accounts.interfaces.js';

// Default synchronization interval in milliseconds (15 minutes)
export const DEFAULT_SYNC_INTERVAL_MS = 15 * 60 * 1000;

// List of supported account providers metadata
export const SUPPORTED_ACCOUNT_PROVIDERS: AccountProviderType[] = [
    { id: 1, name: AccountProvider.GMAIL, displayName: 'Google Mail' },
    { id: 2, name: AccountProvider.OUTLOOK, displayName: 'Microsoft Outlook' },
];
```

#### `accounts.types.ts`
Location: `src/accounts/accounts.types.ts`

```typescript
// Type alias for account identifiers
export type AccountId = string;
```

#### `index.ts` (Accounts Barrel Export)
Location: `src/accounts/index.ts`

```typescript
export * from './accounts.constants.js';
export * from './accounts.enums.js';
export * from './accounts.interfaces.js';
export * from './accounts.types.js';
```

---

### 2.2 Module: `emails` (`src/emails/`)

#### `emails.enums.ts`
Location: `src/emails/emails.enums.ts`

```typescript
// Sorting order for email search & list queries
export enum EmailSearchSortOrder {
    ASC = 'asc',
    DESC = 'desc',
}
```

#### `emails.interfaces.ts`
Location: `src/emails/emails.interfaces.ts`

```typescript
import { Filter, DATE_RANGE } from '../common/index.js';

// Full Email entity interface shared between frontend and backend
export interface Email {
    _id: string;
    accountId: string;
    providerMessageId: string;
    threadId: string;
    from: string;
    to: string[] | string;
    cc: string[] | string;
    bcc: string[] | string;
    subject: string;
    body: string;
    bodyHtml: string;
    bodyPlain: string;
    receivedAt: Date;
    isRead: boolean;
    folders: string[];
}

// Alias for Email entity attributes
export type EmailAttributes = Email;

// Lightweight Email summary DTO for list views
export interface EmailListDTO {
    _id: string;
    subject?: string | undefined;
    from?: string | undefined;
    receivedAt?: Date | undefined;
    isRead?: boolean | undefined;
    body?: string | undefined;
    bodyHtml?: string | undefined;
    bodyPlain?: string | undefined;
}

// Options for fetching paginated emails on frontend
export interface FetchEmailRequestOptions {
    userId: string;
    size: number;
    page: number;
    filters: Filter;
}

// Parameters for full text email search queries
export interface SearchEmailsParams {
    userId: string;
    searchText: string;
    size: number;
    page: number;
}

// Query filter parameters for email retrieval
export interface GetAllEmailsFilters {
    searchText?: string | undefined;
    accountId?: string[] | undefined;
    dateRange?: DATE_RANGE | undefined;
    folders?: string[] | undefined;
    unread?: boolean | undefined;
}

// Request payload for composing and sending an email
export interface ComposeEmailRequestBody {
    accountId: string;
    to: string[];
    subject: string;
    body: string;
}

// Recipient suggestion item returned from contact search
export interface SearchOtherContactsResponse {
    name: string;
    email: string;
}

// Filter dropdown metadata options for email lists
export interface GetFiltersResponse {
    accounts: { id: string; provider: string; emailAddress: string }[];
    folders: { id: string; name: string; providerFolderId: string }[];
}

// Response envelope for email listing endpoints
export interface GetEmailsResponse {
    data: EmailListDTO[];
    size: number;
    page: number;
    total: number;
}
```

#### `emails.constants.ts`
Location: `src/emails/emails.constants.ts`

```typescript
// Default maximum subject length preview truncation
export const DEFAULT_SUBJECT_TRUNCATE_LENGTH = 100;
```

#### `emails.types.ts`
Location: `src/emails/emails.types.ts`

```typescript
// Type alias for email identifier
export type EmailId = string;

// Type union for recipient email address format
export type RecipientAddress = string | string[];
```

#### `index.ts` (Emails Barrel Export)
Location: `src/emails/index.ts`

```typescript
export * from './emails.constants.js';
export * from './emails.enums.js';
export * from './emails.interfaces.js';
export * from './emails.types.js';
```

---

### 2.3 Module: `folders` (`src/folders/`)

#### `folders.enums.ts`
Location: `src/folders/folders.enums.ts`

```typescript
// Category kind of folder (system created vs user custom)
export enum FolderKind {
    SYSTEM = 'SYSTEM',
    CUSTOM = 'CUSTOM',
}

// Standard system folder role classifications
export enum FolderRole {
    INBOX = 'INBOX',
    SENT = 'SENT',
    DRAFTS = 'DRAFTS',
    TRASH = 'TRASH',
    SPAM = 'SPAM',
    ARCHIVE = 'ARCHIVE',
    STARRED = 'STARRED',
    IMPORTANT = 'IMPORTANT',
    OTHER = 'OTHER',
}
```

#### `folders.interfaces.ts`
Location: `src/folders/folders.interfaces.ts`

```typescript
import { Filter, DATE_RANGE } from '../common/index.js';
import { FolderKind, FolderRole } from './folders.enums.js';

// Folder entity attributes definition
export interface FolderAttributes {
    _id?: string | undefined;
    userId: string;
    accountId: string;

    providerFolderId: string;
    parentProviderFolderId: string;

    name: string;
    normalizedName: string;
    role: FolderRole;
    kind: FolderKind;

    totalEmails: number;
    totalUnreadEmails: number;
    totalThreads?: number | undefined;
    totalUnreadThreads?: number | undefined;

    totalChildFolders: number;
    isHidden: boolean;

    color: {
        text: string;
        background: string;
    };

    lastSyncedAt: Date;
    providerMeta?: Record<string, unknown> | undefined;

    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
}

// Request options for folder listing
export interface GetAllFoldersRequestOptions {
    userId: string;
    size: number;
    page: number;
    filters: Filter;
}

// Filters for folder query endpoints
export interface GetAllFoldersFilters {
    searchText?: string | undefined;
    accountId?: string[] | undefined;
    dateRange?: DATE_RANGE | undefined;
}

// Body parameters for folder creation
export interface CreateFolderBodyParams {
    accountId: string;
    folderName: string;
}
```

#### `folders.constants.ts`
Location: `src/folders/folders.constants.ts`

```typescript
import { FolderRole } from './folders.enums.js';

// Core system folder roles list
export const SYSTEM_FOLDER_ROLES: FolderRole[] = [
    FolderRole.INBOX,
    FolderRole.SENT,
    FolderRole.DRAFTS,
    FolderRole.TRASH,
    FolderRole.SPAM,
    FolderRole.ARCHIVE,
    FolderRole.STARRED,
    FolderRole.IMPORTANT,
];
```

#### `folders.types.ts`
Location: `src/folders/folders.types.ts`

```typescript
// Type alias for folder identifier
export type FolderId = string;
```

#### `index.ts` (Folders Barrel Export)
Location: `src/folders/index.ts`

```typescript
export * from './folders.constants.js';
export * from './folders.enums.js';
export * from './folders.interfaces.js';
export * from './folders.types.js';
```

---

### 2.4 Module: `user` (`src/user/`)

#### `user.enums.ts`
Location: `src/user/user.enums.ts`

```typescript
// User account status
export enum UserStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    SUSPENDED = 'SUSPENDED',
}
```

#### `user.interfaces.ts`
Location: `src/user/user.interfaces.ts`

```typescript
// User entity representation
export interface User {
    id: string;
    name: string;
    email: string;
    profilePicture?: string | undefined;
}

// Detailed Auth0 user profile payload object
export interface UserDetailsObject {
    created_at: string;
    email: string;
    email_verified: boolean;
    identities: {
        connection: string;
        provider: string;
        user_id: string;
        isSocial: boolean;
    }[];
    name: string;
    nickname: string;
    picture: string;
    updated_at: string;
    user_id: string;
    user_metadata: Record<string, unknown>;
    last_ip: string;
    last_login: string;
    logins_count: number;
}

// Response interface for update password endpoint
export interface UpdatePasswordResponseObject {
    message: string;
}

// User profile settings data structure
export interface ProfileSettingsDataObject {
    nickname: string;
    name: string;
    picture: string;
    email: string;
    email_verified: boolean;
    sub: string;
    user_metadata: {
        phone_number: string;
    };
}

// Response envelope for profile settings update
export interface UpdateUserProfileSettingsResponse {
    status: boolean;
    message: string;
    data: ProfileSettingsDataObject;
}
```

#### `user.constants.ts`
Location: `src/user/user.constants.ts`

```typescript
// Default avatar placeholder fallback URL
export const DEFAULT_AVATAR_PLACEHOLDER = '/assets/images/default-avatar.png';
```

#### `user.types.ts`
Location: `src/user/user.types.ts`

```typescript
// Type alias for user identifier
export type UserId = string;
```

#### `index.ts` (User Barrel Export)
Location: `src/user/index.ts`

```typescript
export * from './user.constants.js';
export * from './user.enums.js';
export * from './user.interfaces.js';
export * from './user.types.js';
```

---

## 3. Step-by-Step Execution Guide

### Step 1: Create Directories
Execute in terminal inside the `mailsense-types` repository:

```bash
mkdir -p src/accounts src/emails src/folders src/user
```

### Step 2: Implement Code Files
Create all 20 files specified above across the 4 module directories.

### Step 3: Run Type Check & Build Validation
Run:

```bash
pnpm type-check
pnpm build
```

---

## 4. Phase 3 Verification Checklist

- [ ] Modules `accounts`, `emails`, `folders`, `user` exist with 5 files each (`*.constants.ts`, `*.enums.ts`, `*.interfaces.ts`, `*.types.ts`, `index.ts`).
- [ ] Relative imports use explicit `.js` extensions for ESM compatibility (`import { ... } from './*.js'`).
- [ ] `AccountProvider` and sync job status enums built clean.
- [ ] `Email` entity and compose DTOs built clean.
- [ ] `FolderAttributes`, `FolderKind`, `FolderRole` built clean.
- [ ] `User` entity and Auth0 `UserDetailsObject` built clean.
- [ ] `pnpm type-check` completes with 0 errors.
- [ ] `pnpm build` outputs corresponding `.js`, `.cjs`, and `.d.ts` bundles under `dist/accounts/`, `dist/emails/`, `dist/folders/`, and `dist/user/`.
