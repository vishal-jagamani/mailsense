# Codebase Hardening & Architecture v1.4.0 Types — Overview & Contract Changes

> **Target Version:** `@mailsense/types` `v1.7.0`
> **Status:** COMPLETED
> **Created:** 2026-11-12 · **Last Updated:** 2026-11-13

---

## 1. Overview

### Problem Statement

Following the completion of the [v1.4.0 Codebase Health Audit](file:///Users/vishaljagamani/Projects/Projects/mailsense/.agents/plans/codebase-health-audit-report.md#140---2026-11-12), an analysis of the shared TypeScript contracts across `@mailsense/types` and their consumption across Backend and Frontend identified several architectural and contract gaps:

1. **Inline Object Signatures in Core Contracts**:
   - In [`attachments.interfaces.ts`](file:///Users/vishaljagamani/Projects/Projects/mailsense-types/src/attachments/attachments.interfaces.ts#L18-L24), `UploadAttachmentResponse` embedded an inline object type for `attachment: { attachmentId: string; filename: string; mimeType: string; size: number; createdAt: Date; }`.
   - In [`emails.interfaces.ts`](file:///Users/vishaljagamani/Projects/Projects/mailsense-types/src/emails/emails.interfaces.ts#L128-L131), `GetFiltersResponse` embedded inline object array definitions for `accounts: { id: string; provider: string; emailAddress: string }[]` and `folders: { id: string; name: string; providerFolderId: string }[]`.
   - In [`attachments.interfaces.ts`](file:///Users/vishaljagamani/Projects/Projects/mailsense-types/src/attachments/attachments.interfaces.ts#L12), `status` used an untyped string union `'STAGED' | 'ATTACHED' | 'EXPIRED'` instead of a formal domain enum.
     These violated the strict MailSense rule prohibiting inline object types across contract files.
2. **Missing Multi-Tenant Scoped Parameters & DTOs**:
   - `DraftRepository.updateDraft` and `DraftService.saveDraft` require an explicit, strongly typed `UpdateDraftPayload` and `DraftEndpointParams` carrying `draftId`, `userId`, and `accountId` to guarantee multi-tenant scoping and prevent IDOR draft overwrites (`BUG-V14-04`).
   - `uploadStagedAttachment` requires an explicit `UploadStagedAttachmentPayload` carrying validated `accountId` and `userId` context (`BUG-V14-07`).
3. **Strict Boundary Separation (Shared Contracts vs. Layer-Specific Types)**:
   - Per [Feature Implementation Files Standards](file:///Users/vishaljagamani/Projects/Projects/mailsense/.agents/rules/implementation-files-standards.md#24-dedicated-types-files-only-no-types-in-featurecode-files), `@mailsense/types` is strictly reserved for **shared contracts consumed across both Backend and Frontend** (API payloads, response envelopes, entity models, and domain enums).
   - One-sided internal processing structures (such as Backend-only MIME RFC 2822 parsing headers or queue coordination parameters) and Frontend-only UI component states or Next.js App Router dynamic route parameter interfaces must **never** be placed in `@mailsense/types`. Instead, they reside in dedicated feature types files within their respective codebases (`Backend/src/modules/<module>/interfaces/` and `Frontend/src/features/<feature>/types/`).

### Goals

- Introduce domain enums (`ATTACHMENT_STATUS`) and named DTO interfaces (`StagedAttachmentSummaryDTO`, `FilterAccountOption`, `FilterFolderOption`) to eliminate 100% of inline object types and union strings in `@mailsense/types`.
- Standardize multi-tenant API mutation contracts (`UpdateDraftPayload`, `DraftEndpointParams`, `UploadStagedAttachmentPayload`) shared between Backend controllers and Frontend API clients.
- Enforce strict layer separation: ensure `@mailsense/types` contains **only true shared contracts**, while delegating Backend-only and Frontend-only interfaces to their dedicated internal feature type files.
- Produce clean dual CommonJS/ESM and `.d.ts` declaration maps via `@mailsense/types v1.7.0` passing 100% type checks across both Backend and Frontend.

---

## 2. Shared Types in `@mailsense/types` (v1.7.0)

### 2.1 Component: `src/attachments/attachments.enums.ts`

#### [NEW] `ATTACHMENT_STATUS` (Phases 1 & 2)

```typescript
/**
 * Lifecycle state of a staged or persisted email attachment.
 */
export enum ATTACHMENT_STATUS {
  STAGED = "STAGED",
  ATTACHED = "ATTACHED",
  EXPIRED = "EXPIRED",
}
```

---

### 2.2 Component: `src/attachments/attachments.interfaces.ts`

#### [NEW] `StagedAttachmentSummaryDTO` (Phases 1 & 3)

```typescript
/**
 * Normalized summary representation of an uploaded staged attachment.
 * Replaces the previous inline object signature in UploadAttachmentResponse.
 * Includes optional _id for seamless backward compatibility.
 */
export interface StagedAttachmentSummaryDTO {
  attachmentId: string;
  _id?: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}
```

#### [NEW] `UploadStagedAttachmentPayload` (Phases 1 & 2)

```typescript
/**
 * Request payload for initiating staged attachment upload with account context.
 */
export interface UploadStagedAttachmentPayload {
  accountId: string;
}
```

#### [MODIFY] `StagedAttachmentAttributes` (Phases 1 & 2)

```typescript
import { BaseEntity } from "../common/index.js";
import { ATTACHMENT_STATUS } from "./attachments.enums.js";

export interface StagedAttachmentAttributes extends BaseEntity {
  userId: string;
  accountId: string;
  r2Key: string;
  filename: string;
  mimeType: string;
  size: number;
  isInline?: boolean;
  contentId?: string;
  status: ATTACHMENT_STATUS;
  expiresAt: Date;
}
```

#### [MODIFY] `UploadAttachmentResponse` (Phases 1 & 3)

```typescript
import { StagedAttachmentSummaryDTO } from "./attachments.interfaces.js";

export interface UploadAttachmentResponse {
  success: boolean;
  attachment: StagedAttachmentSummaryDTO;
}
```

---

### 2.3 Component: `src/drafts/drafts.interfaces.ts`

#### [NEW] `UpdateDraftPayload` (Phases 1 & 2)

```typescript
/**
 * Strongly typed payload for updating an existing user draft with multi-tenant isolation.
 */
export interface UpdateDraftPayload {
  draftId: string;
  userId: string;
  accountId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  inReplyTo?: string;
}
```

#### [NEW] `DraftEndpointParams` (Phases 1 & 2)

```typescript
/**
 * Route parameter contract for draft-specific operations (/api/drafts/:draftId).
 */
export interface DraftEndpointParams {
  draftId: string;
}
```

---

### 2.4 Component: `src/emails/emails.interfaces.ts`

#### [NEW] `FilterAccountOption` (Phases 1, 2 & 3)

```typescript
/**
 * Dropdown account metadata option for email query filters.
 */
export interface FilterAccountOption {
  id: string;
  provider: string;
  emailAddress: string;
}
```

#### [NEW] `FilterFolderOption` (Phases 1, 2 & 3)

```typescript
/**
 * Dropdown folder metadata option for email query filters.
 */
export interface FilterFolderOption {
  id: string;
  name: string;
  providerFolderId: string;
}
```

#### [MODIFY] `GetFiltersResponse` (Phases 1, 2 & 3)

```typescript
import {
  FilterAccountOption,
  FilterFolderOption,
} from "./emails.interfaces.js";

/**
 * Filter dropdown metadata options for email lists.
 * Replaces previous inline object array signatures with dedicated named interfaces.
 */
export interface GetFiltersResponse {
  accounts: FilterAccountOption[];
  folders: FilterFolderOption[];
}
```

---

## 3. Layer-Specific (One-Sided) Types Architecture

To maintain strict contract hygiene and adhere to the project standards, one-sided types are explicitly partitioned into dedicated files within the Backend and Frontend codebases rather than being included in `@mailsense/types`:

### 3.1 Backend-Only Internal Interfaces

These interfaces are internal to backend data transformation, MIME parsing, and background queuing:

1. **`Backend/src/integrations/gmail/interfaces/gmail.interface.ts`**:

   ```typescript
   export interface ParsedMimeHeaders {
     from: string;
     to: string[];
     cc: string[];
     bcc: string[];
     subject: string;
     date: Date;
     messageId: string;
     inReplyTo?: string;
     references?: string[];
   }

   export interface MimeMessagePayload {
     rawMime: string;
     threadId?: string;
   }
   ```

2. **`Backend/src/modules/accounts/interfaces/account.interface.ts`**:
   ```typescript
   export interface AccountSyncCoordinatorParams {
     accountId: string;
     userId: string;
     fullSync?: boolean;
     priority?: number;
   }
   ```

### 3.2 Frontend-Only UI & Dynamic Route Interfaces

These interfaces are strictly bound to Next.js App Router dynamic segment params and React client-side UI states:

1. **`Frontend/src/features/inbox/types/inbox-route.types.ts`**:

   ```typescript
   export interface AccountInboxRouteParams {
     account: string;
   }

   export interface EmailDetailRouteParams {
     account: string;
     email: string;
   }
   ```

2. **`Frontend/src/features/folders/types/folder-route.types.ts`**:
   ```typescript
   export interface FolderEmailListRouteParams {
     folder: string;
   }
   ```
3. **`Frontend/src/features/folders/types/folder-ui.types.ts`**:

   ```typescript
   import { FolderAttributes } from "@mailsense/types";

   export interface FolderFilterState {
     availableFolders: FolderAttributes[];
     filteredFolders: FolderAttributes[];
     searchQuery: string;
     selectedAccountIds: string[];
     singleAccountId: string | null;
     isMultiAccountSelected: boolean;
     isLoading: boolean;
   }
   ```

---

## 4. Package Version & CHANGELOG.md

### Package Version

```json
{
  "name": "@mailsense/types",
  "version": "1.7.0"
}
```

### `mailsense-types/CHANGELOG.md` Snippet

```markdown
## [1.7.0] - 2026-11-13

### Added

- Domain enum `ATTACHMENT_STATUS` in `src/attachments/attachments.enums.ts`.
- Interface `StagedAttachmentSummaryDTO` in `src/attachments/attachments.interfaces.ts`.
- Interface `UploadStagedAttachmentPayload` in `src/attachments/attachments.interfaces.ts`.
- Interfaces `UpdateDraftPayload` and `DraftEndpointParams` in `src/drafts/drafts.interfaces.ts`.
- Interfaces `FilterAccountOption` and `FilterFolderOption` in `src/emails/emails.interfaces.ts`.

### Changed

- `UploadAttachmentResponse`: Replaced inline object definition with named `StagedAttachmentSummaryDTO`.
- `GetFiltersResponse`: Replaced inline object arrays with `FilterAccountOption[]` and `FilterFolderOption[]`.
- `StagedAttachmentAttributes`: Updated `status` field to use `ATTACHMENT_STATUS` enum instead of string union.
```

---

## 5. Build & Local Testing Steps

```bash
# 1. Navigate to mailsense-types package and build dual CJS/ESM and DTS bundles
cd /Users/vishaljagamani/Projects/Projects/mailsense-types && pnpm build

# 2. Sync generated dist files to Frontend and Backend node_modules
cp -r /Users/vishaljagamani/Projects/Projects/mailsense-types/dist/* /Users/vishaljagamani/Projects/Projects/mailsense/Frontend/node_modules/@mailsense/types/dist/
cp -r /Users/vishaljagamani/Projects/Projects/mailsense-types/dist/* /Users/vishaljagamani/Projects/Projects/mailsense/Backend/node_modules/@mailsense/types/dist/

# 3. Verify downstream TypeScript compilation
cd /Users/vishaljagamani/Projects/Projects/mailsense/Backend && pnpm build
cd /Users/vishaljagamani/Projects/Projects/mailsense/Frontend && npx tsc --noEmit
```
