# Phase 4 Implementation Guide: Integrations Modules & Root Exports (`providers`, `events`, `workers`)

## Overview

This document provides the exact source code definitions, file locations, exports, and verification steps for **Phase 4: Integrations Modules & Root Exports (`providers`, `events`, `workers`, and `src/index.ts`)** of the `@mailsense/types` library.

---

## 1. Directory Structure for Phase 4

```
src/
├── providers/
│   ├── gmail.enums.ts
│   ├── gmail.interfaces.ts
│   ├── outlook.enums.ts
│   ├── outlook.interfaces.ts
│   ├── provider.interfaces.ts
│   ├── provider.types.ts
│   └── index.ts
├── events/
│   ├── events.enums.ts
│   ├── events.interfaces.ts
│   └── index.ts
├── workers/
│   ├── workers.interfaces.ts
│   └── index.ts
└── index.ts                       # Root Barrel Export
```

---

## 2. File Specifications & Exact Implementation Code

### 2.1 Module: `providers` (`src/providers/`)

#### `gmail.enums.ts`
Location: `src/providers/gmail.enums.ts`

```typescript
// Standard Gmail system label identifiers
export enum GMAIL_LABELS {
    INBOX = 'INBOX',
    SENT = 'SENT',
    SPAM = 'SPAM',
    TRASH = 'TRASH',
    UNREAD = 'UNREAD',
    STARRED = 'STARRED',
    IMPORTANT = 'IMPORTANT',
}

// Gmail label visibility in message lists
export enum GmailLabelMessageListVisibility {
    SHOW = 'show',
    HIDE = 'hide',
}

// Gmail label visibility in label list sidebar
export enum GmailLabelLabelListVisibility {
    LABEL_SHOW = 'labelShow',
    LABEL_SHOW_IF_UNREAD = 'labelShowIfUnread',
    LABEL_HIDE = 'labelHide',
}

// Type of Gmail label (system created vs user defined)
export enum GmailLabelType {
    SYSTEM = 'system',
    USER = 'user',
}
```

#### `gmail.interfaces.ts`
Location: `src/providers/gmail.interfaces.ts`

```typescript
import { GmailLabelMessageListVisibility, GmailLabelLabelListVisibility, GmailLabelType } from './gmail.enums.js';

// User profile object returned from Google OAuth / userinfo endpoint
export interface GmailUserProfile {
    sub: string;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    email: string;
    email_verified: boolean;
    locale: string;
}

// Gmail API header structure
export interface GmailMessageHeaderFull {
    name: string;
    value: string;
}

// Gmail API payload part structure
export interface GmailMessagePartsFull {
    partId: string;
    mimeType: string;
    filename: string;
    headers: GmailMessageHeaderFull[];
    body: { size: number; data: string };
}

// Full Gmail API message resource payload
export interface GmailMessageObjectFull {
    id: string;
    threadId: string;
    labelIds: string[];
    snippet: string;
    payload: {
        partId: string;
        mimeType: string;
        filename: string;
        headers: GmailMessageHeaderFull[];
        body: { size: number; data?: string };
        parts: GmailMessagePartsFull[];
    };
    sizeEstimate: number;
    historyId: string;
    internalDate: string;
}

// List response envelope from Gmail messages API
export interface GmailMessages {
    messages: { id: string; threadId: string }[];
    nextPageToken?: string;
    resultSizeEstimate: number;
}

// Simplified message reference for history records
export interface GmailMessageRef {
    id: string;
    threadId: string;
}

// Gmail history change record item
export interface GmailHistoryRecord {
    id: string;
    messages?: GmailMessageObjectFull[];
    messagesAdded?: { message: GmailMessageRef }[];
    messagesDeleted?: { message?: GmailMessageRef; messageId?: string; id?: string }[];
    labelsAdded?: string[];
    labelsRemoved?: string[];
}

// Response payload from Gmail History API
export interface GmailHistoryResponse {
    history: GmailHistoryRecord[];
    nextPageToken?: string;
    historyId: string;
}

// Individual label details from Gmail Labels API
export interface GmailLabel {
    id: string;
    name: string;
    messageListVisibility?: GmailLabelMessageListVisibility;
    labelListVisibility?: GmailLabelLabelListVisibility;
    type: GmailLabelType;
    messagesTotal?: number;
    messagesUnread?: number;
    threadsTotal?: number;
    threadsUnread?: number;
    color?: {
        textColor: string;
        backgroundColor: string;
    };
}

// Gmail labels list API response
export interface GmailLabelsListResponse {
    labels: GmailLabel[];
}

// Google People API Person contact resource
export interface GooglePerson {
    resourceName: string;
    etag: string;
    emailAddresses?: {
        metadata: { primary?: boolean; sourcePrimary?: boolean; source: { type: string; id: string } };
        value: string;
    }[];
    names?: {
        metadata: { primary?: boolean; sourcePrimary?: boolean; source: { type: string; id: string } };
        displayName: string;
        familyName?: string;
        givenName?: string;
    }[];
}

// Google People API search response wrapper
export interface GoogleOtherContactsSearchResponse {
    results?: {
        person: GooglePerson;
    }[];
}
```

#### `outlook.enums.ts`
Location: `src/providers/outlook.enums.ts`

```typescript
// Outlook Graph API standard well-known folder names
export enum OutlookFolders {
    INBOX = 'inbox',
    SENT = 'sentitems',
    ARCHIVE = 'archive',
    DRAFTS = 'drafts',
    DELETED = 'deleteditems',
    SPAM = 'spam',
    OUTBOX = 'outbox',
}

// Delta change reason for Outlook message mutation events
export enum OutlookMessageRemovedReason {
    CREATED = 'created',
    DELETED = 'deleted',
    UPDATED = 'updated',
}
```

#### `outlook.interfaces.ts`
Location: `src/providers/outlook.interfaces.ts`

```typescript
// User profile object returned from Microsoft Graph API /me endpoint
export interface OutlookUserProfile {
    id: string;
    displayName: string;
    givenName: string;
    surname: string;
    mail: string;
}

// Email address recipient object in Microsoft Graph API
export interface OutlookMessageEmailAddress {
    name: string;
    address: string;
}

// Full message resource object from Microsoft Graph API
export interface OutlookMessageObjectFull {
    id: string;
    receivedDateTime: string;
    sentDateTime: string;
    hasAttachments: boolean;
    subject: string;
    bodyPreview: string;
    parentFolderId: string;
    conversationId: string;
    conversationIndex: string;
    isRead: boolean;
    isDraft: boolean;
    webLink: string;
    body: {
        contentType: string;
        content: string;
    };
    sender: { emailAddress: OutlookMessageEmailAddress };
    from: { emailAddress: OutlookMessageEmailAddress };
    toRecipients: { emailAddress: OutlookMessageEmailAddress }[];
    ccRecipients: { emailAddress: OutlookMessageEmailAddress }[];
    bccRecipients: { emailAddress: OutlookMessageEmailAddress }[];
}

// Response wrapper for Microsoft Graph API messages query
export interface OutlookMessagesResponse {
    '@odata.context': string;
    value: OutlookMessageObjectFull[];
    '@odata.nextLink'?: string;
    '@odata.deltaLink'?: string;
}
```

#### `provider.interfaces.ts`
Location: `src/providers/provider.interfaces.ts`

```typescript
import { GmailOAuthAccessTokenResponse, OutlookOAuthAccessTokenResponse } from '../accounts/accounts.interfaces.js';
import { GmailUserProfile, GmailMessageObjectFull } from './gmail.interfaces.js';
import { OutlookUserProfile, OutlookMessageObjectFull } from './outlook.interfaces.js';

// Standard sync result payload returned from provider sync adapters
export interface EmailSyncResult {
    addedEmails: Record<string, unknown>[];
    deletedEmailIds: string[];
    newCursor: string;
}

// Union type for OAuth access token response across providers
export type IEmailTAuthToken = GmailOAuthAccessTokenResponse | OutlookOAuthAccessTokenResponse;

// Union type for user profile objects across providers
export type IEmailTUserProfile = GmailUserProfile | OutlookUserProfile;

// Union type for outgoing mail dispatch result across providers
export type IEmailTSendEmailResult = Partial<GmailMessageObjectFull> | OutlookMessageObjectFull;
```

#### `provider.types.ts`
Location: `src/providers/provider.types.ts`

```typescript
import { GmailUserProfile } from './gmail.interfaces.js';
import { OutlookUserProfile } from './outlook.interfaces.js';

// Type alias for provider profile details payload
export type ProviderUserProfile = GmailUserProfile | OutlookUserProfile;
```

#### `index.ts` (Providers Barrel Export)
Location: `src/providers/index.ts`

```typescript
export * from './gmail.enums.js';
export * from './gmail.interfaces.js';
export * from './outlook.enums.js';
export * from './outlook.interfaces.js';
export * from './provider.interfaces.js';
export * from './provider.types.js';
```

---

### 2.2 Module: `events` (`src/events/`)

#### `events.enums.ts`
Location: `src/events/events.enums.ts`

```typescript
// System event names dispatched across event bus
export enum SystemEvent {
    SYNC_COMPLETED = 'sync:completed',
    EMAIL_CREATED = 'email:created',
}
```

#### `events.interfaces.ts`
Location: `src/events/events.interfaces.ts`

```typescript
import { SystemEvent } from './events.enums.js';

// Payload for SYNC_COMPLETED system event
export interface SyncCompletedPayload {
    accountId: string;
    addedEmailsCount: number;
    deletedEmailsCount: number;
    startedAt: number;
    completedAt: number;
}

// Payload for EMAIL_CREATED system event
export interface EmailCreatedPayload {
    accountId: string;
    email: Record<string, unknown>;
}

// Registry interface mapping system events to their payload types
export interface SystemEventPayloads {
    [SystemEvent.SYNC_COMPLETED]: SyncCompletedPayload;
    [SystemEvent.EMAIL_CREATED]: EmailCreatedPayload;
}
```

#### `index.ts` (Events Barrel Export)
Location: `src/events/index.ts`

```typescript
export * from './events.enums.js';
export * from './events.interfaces.js';
```

---

### 2.3 Module: `workers` (`src/workers/`)

#### `workers.interfaces.ts`
Location: `src/workers/workers.interfaces.ts`

```typescript
// Background sync job worker execution result
export interface SyncJobResult {
    addedEmailsCount: number;
    deletedEmailsCount: number;
}
```

#### `index.ts` (Workers Barrel Export)
Location: `src/workers/index.ts`

```typescript
export * from './workers.interfaces.js';
```

---

### 2.4 Root Barrel Export (`src/index.ts`)
Location: `src/index.ts`

```typescript
export * from './common/index.js';
export * from './accounts/index.js';
export * from './emails/index.js';
export * from './folders/index.js';
export * from './user/index.js';
export * from './providers/index.js';
export * from './events/index.js';
export * from './workers/index.js';
```

---

## 3. Step-by-Step Execution Guide

### Step 1: Create Directories
Execute in terminal inside the `mailsense-types` repository:

```bash
mkdir -p src/providers src/events src/workers
```

### Step 2: Implement Code Files
Create all 14 files specified above across `providers`, `events`, `workers`, and `src/index.ts`.

### Step 3: Run Full Library Type Check & Build
Run:

```bash
pnpm type-check
pnpm build
```

---

## 4. Phase 4 Verification Checklist

- [ ] `src/providers/` contains Gmail, Outlook, and provider interface files.
- [ ] `src/events/` contains `SystemEvent` enum and payload interfaces.
- [ ] `src/workers/` contains `SyncJobResult` interface.
- [ ] `src/index.ts` root barrel exports all 8 submodules cleanly.
- [ ] `pnpm type-check` executes with 0 errors across the entire project.
- [ ] `pnpm build` (`tsup`) bundles all 9 entry points (`dist/index.js` + 8 subpath modules) with dual ESM/CJS and `.d.ts` declaration maps.
