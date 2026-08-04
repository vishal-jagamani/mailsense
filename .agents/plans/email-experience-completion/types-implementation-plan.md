# Email Experience Completion Types — Overview & Contract Changes

> **Target Version:** `@mailsense/types` `v1.2.0`
> **Status:** COMPLETED
> **Last Updated:** 2026-08-04

---

## 1. Overview

### Problem Statement

Developing Email Experience Completion features (Threading, Attachments, Folder Movement, Drafts) requires shared TypeScript contracts across `Backend`, `Frontend`, and `@mailsense/types`. Defining types inline or missing shared interfaces causes contract mismatches, `any`/`unknown` type fallbacks, and local linking failures during development.

### Goals

- Centralize all contract additions and modifications for Email Experience Completion features in `@mailsense/types`.
- Enforce strict, compiler-enforced interfaces for Threading, Stream Attachments, Folder Relocation, and Draft Management with zero `any`, `never`, or `unknown` types.
- Provide a single, non-duplicated manifest of target interfaces and enums organized by file, clearly specifying which implementation phase utilizes each type.
- Specify proposed target version bump (`@mailsense/types@1.2.0`) and `CHANGELOG.md` entry inside the plan file without modifying actual code files during planning.

---

## 2. Types to Add & Modify

### 2.1 Component: `src/emails/emails.interfaces.ts`

#### [MODIFY] `EmailAttributes` (Phases 1 & 2)

Extended entity interface representing full email documents in MongoDB and application state.

```typescript
export interface EmailAttributes extends BaseEntity {
    accountId: string;
    providerMessageId: string;
    threadId: string; // Phase 1: Thread grouping key
    threadCount?: number; // Phase 1: Total emails in conversation thread
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
    attachments?: EmailAttachment[]; // Phase 2: Array of attached file metadata
}
```

#### [MODIFY] `EmailListDTO` (Phases 1 & 2)

Lightweight DTO for inbox list queries and card rendering.

```typescript
export interface EmailListDTO extends BaseEntity {
    subject?: string | undefined;
    from?: string | undefined;
    receivedAt?: Date | undefined;
    isRead?: boolean | undefined;
    providerMessageId?: string | undefined;
    accountId?: string | undefined;
    threadId?: string | undefined; // Phase 1: Thread grouping key
    threadCount?: number | undefined; // Phase 1: Thread message count
    attachmentCount?: number | undefined; // Phase 2: Total attachments badge count
    body?: string | undefined;
    bodyHtml?: string | undefined;
    bodyPlain?: string | undefined;
}
```

#### [NEW] `EmailAttachment` (Phase 2)

Metadata interface for email attachments (streaming proxy preview and download).

```typescript
export interface EmailAttachment {
    attachmentId: string;
    filename: string;
    mimeType: string;
    size: number;
    contentId?: string;
    isInline: boolean;
}
```

#### [NEW] `GetThreadResponse` (Phase 1)

Response envelope for thread conversation endpoint (`GET /api/emails/thread/:emailId`).

```typescript
export interface GetThreadResponse {
    thread: EmailAttributes[];
    threadId: string;
}
```

#### [NEW] `MoveEmailsRequestBody` (Phase 3)

Request payload for moving or relabeling emails.

```typescript
export interface MoveEmailsRequestBody {
    emailIds: string[];
    targetFolderIds: string[];
    removeFolderIds?: string[];
}
```

#### [NEW] `MoveEmailsResponse` (Phase 3)

Response payload for folder relocation operations.

```typescript
export interface MoveEmailsResponse {
    success: boolean;
    updatedCount: number;
}
```

---

### 2.2 Component: `src/emails/emails.enums.ts`

#### [MODIFY] `EMAIL_STATUS` (Phase 4)

Enum for email lifecycle state.

```typescript
export enum EMAIL_STATUS {
    RECEIVED = 'received',
    DRAFT = 'draft',
    SENT = 'sent',
}
```

---

### 2.3 Component: `src/drafts/drafts.interfaces.ts` (Phase 4)

#### [NEW] `DraftAttributes` (Phase 4)

Full Draft entity interface shared between frontend and backend.

```typescript
import { BaseEntity } from '../common/index.js';
import { EmailAttachment } from '../emails/emails.interfaces.js';

export interface DraftAttributes extends BaseEntity {
    userId: string;
    accountId: string;
    providerDraftId?: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    bodyPlain?: string;
    inReplyTo?: string;
    attachments?: EmailAttachment[];
    lastSavedAt: Date;
    syncedToProvider?: boolean;
}
```

#### [NEW] `SaveDraftRequestBody` (Phase 4)

Request body payload for auto-save draft endpoint (`POST /api/drafts/save`).

```typescript
export interface SaveDraftRequestBody {
    draftId?: string;
    accountId: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    inReplyTo?: string;
}
```

#### [NEW] `SendDraftResponse` (Phase 4)

Response payload when dispatching a draft (`POST /api/drafts/send`).

```typescript
export interface SendDraftResponse {
    sentEmailId: string;
    providerMessageId: string;
}
```

#### [NEW] `DraftListDTO` (Phase 4)

Summary DTO for draft list view.

```typescript
export interface DraftListDTO extends BaseEntity {
    accountId: string;
    to: string[];
    subject: string;
    lastSavedAt: Date;
    snippet?: string;
}
```

---

### 2.4 Component: Module Exports & Build Config (`src/drafts/index.ts`, `src/index.ts`, `package.json`, `tsup.config.ts`)

#### [NEW] [src/drafts/index.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense-types/src/drafts/index.ts) (Phase 4)

```typescript
export * from './drafts.interfaces.js';
```

#### [MODIFY] [src/index.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense-types/src/index.ts) (Phase 4)

```typescript
export * from './accounts/index.js';
export * from './common/index.js';
export * from './drafts/index.js';
export * from './emails/index.js';
export * from './events/index.js';
export * from './folders/index.js';
export * from './providers/index.js';
export * from './user/index.js';
export * from './workers/index.js';
```

#### [MODIFY] [package.json](file:///Users/vishaljagamani/Projects/Projects/mailsense-types/package.json) & [tsup.config.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense-types/tsup.config.ts)

- Version set to `1.2.0`.
- Registered `./drafts` export subpath in `package.json`.
- Added `'src/drafts/index.ts'` entrypoint in `tsup.config.ts`.

---

## 3. Package Version & `CHANGELOG.md` Update

### Package Version

Target version update to be applied in `/Users/vishaljagamani/Projects/Projects/mailsense-types/package.json` upon release execution:

```json
"version": "1.2.0"
```

### `mailsense-types/CHANGELOG.md` Snippet

Target changelog block to be appended under `## [Unreleased]` in `/Users/vishaljagamani/Projects/Projects/mailsense-types/CHANGELOG.md` upon release execution:

```markdown
## [1.2.0] - 2026-08-04

### Added

- Added `GetThreadResponse` contract and `threadId`, `threadCount` properties to `EmailAttributes` and `EmailListDTO` for email thread grouping (Phase 1).
- Added `EmailAttachment` interface, `attachments` field to `EmailAttributes`, and `attachmentCount` to `EmailListDTO` for stream attachment handling (Phase 2).
- Added `MoveEmailsRequestBody` and `MoveEmailsResponse` contracts for folder/label relocation operations (Phase 3).
- Added `EMAIL_STATUS` enum and dedicated `drafts` module containing `DraftAttributes`, `SaveDraftRequestBody`, `SendDraftResponse`, and `DraftListDTO` contracts (Phase 4).

### Changed

- Updated `ComposeEmailRequestBody` to support optional `cc`, `bcc`, and `inReplyTo` parameters.
```

---

## 4. Build & Local Testing Steps

```bash
# 1. Build @mailsense/types package
cd /Users/vishaljagamani/Projects/Projects/mailsense-types && pnpm build

# 2. Sync build output to Frontend node_modules (if local symlink fails)
cp -r /Users/vishaljagamani/Projects/Projects/mailsense-types/dist/* /Users/vishaljagamani/Projects/Projects/mailsense/Frontend/node_modules/@mailsense/types/dist/

# 3. Verify Backend TypeScript
cd /Users/vishaljagamani/Projects/Projects/mailsense/Backend && pnpm build

# 4. Verify Frontend TypeScript
cd /Users/vishaljagamani/Projects/Projects/mailsense/Frontend && npx tsc --noEmit
```
