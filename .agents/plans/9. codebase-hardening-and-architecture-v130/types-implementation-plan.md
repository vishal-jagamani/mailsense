# Codebase Hardening & Architecture v1.3.0 Types — Overview & Contract Changes

> **Target Version:** `@mailsense/types` `v1.6.1`
> **Status:** APPROVED
> **Created:** 2026-10-16 · **Last Updated:** 2026-10-16

---

## 1. Overview

### Problem Statement

During the [v1.3.0 Codebase Health Audit](file:///Users/vishaljagamani/Projects/Projects/mailsense/.agents/plans/codebase-health-audit-report.md), an inspection of the active TypeScript contracts across Backend and Frontend revealed several residual type-safety gaps:
1. **Unshared Request/Response DTOs**: Batch action request bodies (e.g. `ids: string[]`), folder query parameters (`accountId: string`), and attachment endpoint parameters are frequently redefined inline as ad-hoc object literals (`{ emailId: string }`, `{ ids: string[] }`), triggering ESLint `no-restricted-syntax` errors and violating MailSense Coding Standards Rule 2.3.
2. **Multi-Tenant Ownership Parameters**: The newly secured endpoints for email reads, thread fetching, attachment streaming, and folder operations require standardized typed parameter contracts that carry tenant context (`userId` and `accountId`) consistently between frontend API clients and backend controllers/services.
3. **Consolidation of Entity Contracts**: `Frontend/src/entities/` currently defines parallel types for accounts, emails, and folders. Normalizing these in `@mailsense/types` enables the complete elimination of `Frontend/src/entities/` without breaking any downstream consumers.

### Goals

- Introduce canonical shared contracts in `@mailsense/types` for batch operations, folder synchronization parameters, and attachment streaming options.
- Ensure 100% type safety with strictly zero inline types (`{ id: string }`), strictly zero `any`, `never`, or `unknown`.
- Enable seamless end-to-end type sharing between Backend routes/controllers and Frontend React Query mutation/query hooks.
- Publish a non-breaking semantic patch release (`v1.6.1`).

---

## 2. Types to Add & Modify

### 2.1 Component: `src/emails/emails.interfaces.ts`

#### [NEW] `BatchEmailActionRequest` (Phases 1 & 2)

```typescript
/**
 * Request payload for batch operations across multiple emails
 * (e.g., mark unread, star, archive, delete, move).
 */
export interface BatchEmailActionRequest {
    emailIds: string[];
}
```

#### [NEW] `EmailEndpointParams` (Phases 1 & 2)

```typescript
/**
 * Route parameters for single-email operations.
 */
export interface EmailEndpointParams {
    emailId: string;
}
```

#### [NEW] `EmailAttachmentEndpointParams` (Phases 1 & 2)

```typescript
/**
 * Route parameters for attachment downloads and streaming proxies.
 */
export interface EmailAttachmentEndpointParams {
    emailId: string;
    attachmentId: string;
}
```

---

### 2.2 Component: `src/folders/folders.interfaces.ts`

#### [NEW] `FolderSyncRequestParams` (Phases 1 & 2)

```typescript
/**
 * Parameters for triggering account folder synchronization.
 */
export interface FolderSyncRequestParams {
    accountId: string;
}
```

#### [NEW] `CreateFolderPayload` (Phases 1 & 2)

```typescript
/**
 * Payload for creating a new folder/label under a specific provider account.
 */
export interface CreateFolderPayload {
    accountId: string;
    folderName: string;
}
```

#### [NEW] `FolderEndpointParams` (Phases 1 & 2)

```typescript
/**
 * Route parameters for operations targeting a specific folder entity.
 */
export interface FolderEndpointParams {
    folderId: string;
}
```

---

## 3. Package Version & CHANGELOG.md Update

### Package Version

```json
{
  "name": "@mailsense/types",
  "version": "1.6.1"
}
```

### `mailsense-types/CHANGELOG.md` Snippet

```markdown
## [1.6.1] - 2026-10-16

### Added
- Added `BatchEmailActionRequest`, `EmailEndpointParams`, and `EmailAttachmentEndpointParams` in `emails.interfaces.ts` for standardized route parameters.
- Added `FolderSyncRequestParams`, `CreateFolderPayload`, and `FolderEndpointParams` in `folders.interfaces.ts` for multi-tenant folder operations.
- Enforced strict zero-inline-types compliance across all exported API contracts.
```

---

## 4. Build & Local Testing Steps

```bash
# 1. Build types package
cd /Users/vishaljagamani/Projects/Projects/mailsense-types && pnpm build

# 2. Sync to Backend and Frontend node_modules
cp -r /Users/vishaljagamani/Projects/Projects/mailsense-types/dist/* /Users/vishaljagamani/Projects/Projects/mailsense/Backend/node_modules/@mailsense/types/dist/
cp -r /Users/vishaljagamani/Projects/Projects/mailsense-types/dist/* /Users/vishaljagamani/Projects/Projects/mailsense/Frontend/node_modules/@mailsense/types/dist/

# 3. Verify TypeScript builds in downstream packages
cd /Users/vishaljagamani/Projects/Projects/mailsense/Backend && pnpm build
cd /Users/vishaljagamani/Projects/Projects/mailsense/Frontend && npx tsc --noEmit
```
