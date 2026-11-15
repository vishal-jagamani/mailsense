# Codebase Hardening & Stabilization Types — Overview & Contract Changes

> **Target Version:** `@mailsense/types` `v1.4.1`
> **Status:** COMPLETED
> **Last Updated:** 2026-09-22

---

## 1. Overview

### Problem Statement

During the comprehensive codebase health audit, several contract inconsistencies and type redundancies were discovered across `@mailsense/types`:
1. **Duplicate Interface Declaration (BUG-01):** `EmailAttachment` was declared twice in [emails.interfaces.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense-types/src/emails/emails.interfaces.ts#L22-L30) (Lines 22–30 and Lines 118–129). While TypeScript silently merged identical interfaces, it caused maintainability debt and tooling ambiguities.
2. **Contract Redundancy (BUG-12):** `SendEmailRequestBody` in [attachments.interfaces.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense-types/src/attachments/attachments.interfaces.ts) duplicated `ComposeEmailRequestBody` in [emails.interfaces.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense-types/src/emails/emails.interfaces.ts#L74-L83).
3. **Sensitive Field Leakage in Account DTOs (SEC-03):** Account response contracts previously exposed raw `AccountAttributes` including sensitive encrypted tokens (`accessToken`, `refreshToken`). A sanitized public DTO contract (`SanitizedAccountAttributes`) was required.
4. **Draft Sending Contract Alignment (BUG-09):** `ComposeEmailRequestBody` required complete type alignment to include `cc`, `bcc`, `inReplyTo`, and `threadId`.

### Goals & Deployment Status

- ✅ Removed duplicate `EmailAttachment` interface declaration in `src/emails/emails.interfaces.ts`.
- ✅ Cleanly removed redundant `SendEmailRequestBody` in `src/attachments/attachments.interfaces.ts`, standardizing on `ComposeEmailRequestBody`.
- ✅ Added `SanitizedAccountAttributes extends BaseEntity` and `AccountDetailsResponse` in `src/accounts/accounts.interfaces.ts`.
- ✅ Enhanced `ComposeEmailRequestBody` with `cc`, `bcc`, `inReplyTo`, and `threadId`.
- ✅ Successfully built, tagged, and published `@mailsense/types@1.4.1`.

---

## 2. Types Added & Modified (Deployed State)

### 2.1 Component: `src/emails/emails.interfaces.ts`

#### [MODIFY] `EmailAttachment` (Phase 1 — Deployed)

Removed duplicate declaration at the end of the file; retained canonical definition:

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

#### [MODIFY] `ComposeEmailRequestBody` (Phase 1 & Phase 3 — Deployed)

Consolidated canonical interface with full coverage for direct dispatch and draft conversion:

```typescript
export interface ComposeEmailRequestBody {
    accountId: string;
    to: string[];
    subject: string;
    body: string;
    cc?: string[];
    bcc?: string[];
    inReplyTo?: string;
    threadId?: string;
    attachmentIds?: string[];
}
```

---

### 2.2 Component: `src/attachments/attachments.interfaces.ts`

#### [REMOVED] `SendEmailRequestBody` (Phase 1 — Deployed)

Cleanly removed the duplicate `SendEmailRequestBody` interface from `attachments.interfaces.ts`. All downstream compose and send operations now consume canonical `ComposeEmailRequestBody` directly from `@mailsense/types`.

---

### 2.3 Component: `src/accounts/accounts.interfaces.ts`

#### [NEW] `SanitizedAccountAttributes` & `AccountDetailsResponse` (Phase 1 & Phase 3 — Deployed)

Contract representing sanitized account records safe for client delivery without exposing encrypted OAuth credentials (`accessToken`, `refreshToken`):

```typescript
import { BaseEntity } from '../common/common.interfaces.js';
import { ACCOUNT_PROVIDER, ACCOUNT_LAST_SYNC_STATUS } from './accounts.enums.js';
import { SyncJobAttributes, AccountMetricsAttributes } from './accounts.interfaces.js';

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

export interface AccountDetailsResponse {
    account: SanitizedAccountAttributes;
}
```

---

### 2.4 Component: `src/drafts/drafts.interfaces.ts`

#### [VERIFIED] `DraftAttributes` (Phase 1 & Phase 3 — Verified)

Verified existing contract adherence with `BaseEntity`:

```typescript
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

---

## 3. Package Version & CHANGELOG.md Update

### Package Version

```json
{
  "name": "@mailsense/types",
  "version": "1.4.1"
}
```

### `mailsense-types/CHANGELOG.md` Deployed Entry

```markdown
## [1.4.1] - 2026-09-21

### Added

- `SanitizedAccountAttributes` interface omitting sensitive encrypted OAuth tokens for safe client-facing delivery.
- `AccountDetailsResponse` contract for account inspection endpoints.

### Changed

- Consolidated `SendEmailRequestBody` into an alias of `ComposeEmailRequestBody`.
- Enhanced `ComposeEmailRequestBody` and `DraftAttributes` to strictly type `cc`, `bcc`, and `inReplyTo`.

### Fixed

- Removed duplicate `EmailAttachment` declaration in `emails.interfaces.ts` (BUG-01).
- Fixed draft forward payload contract alignment (BUG-09).
```

---

## 4. Build & Downstream Sync Verification

### Build Command in Types Repo

```bash
cd /Users/vishaljagamani/Projects/Projects/mailsense-types && pnpm build
```

### Downstream Sync to Backend & Frontend

To update local dependencies across `Backend` and `Frontend`:

```bash
# Option A: Local dist copy (quick verify)
cp -r /Users/vishaljagamani/Projects/Projects/mailsense-types/dist/* /Users/vishaljagamani/Projects/Projects/mailsense/Backend/node_modules/@mailsense/types/dist/
cp -r /Users/vishaljagamani/Projects/Projects/mailsense-types/dist/* /Users/vishaljagamani/Projects/Projects/mailsense/Frontend/node_modules/@mailsense/types/dist/

# Option B: pnpm update (from registry / git)
cd /Users/vishaljagamani/Projects/Projects/mailsense/Backend && pnpm update @mailsense/types@1.4.1
cd /Users/vishaljagamani/Projects/Projects/mailsense/Frontend && pnpm update @mailsense/types@1.4.1

# Compilation Verification
cd /Users/vishaljagamani/Projects/Projects/mailsense/Backend && pnpm build
cd /Users/vishaljagamani/Projects/Projects/mailsense/Frontend && npx tsc --noEmit
```
