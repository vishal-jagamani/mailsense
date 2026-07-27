# Phase 6 Implementation Guide: Backend Refactoring & Integration

## Overview

This document details the exact refactoring steps, dependency additions, import replacements, obsolete file cleanup, and verification commands for **Phase 6: Backend Refactoring & Integration** of `@vishaljagamani/mailsense-types` into the `Backend/` service of MailSense.

---

## 1. Step 1: Update `Backend/package.json`

Add the `@vishaljagamani/mailsense-types` dependency to `Backend/package.json`.

```json
{
  "dependencies": {
    "@vishaljagamani/mailsense-types": "^1.0.0"
  }
}
```

Run installation in the terminal:

```bash
cd Backend
pnpm install
```

---

## 2. Step 2: Codebase Import Replacements in `Backend/src`

Replace local type imports across backend modules with direct package imports from `@vishaljagamani/mailsense-types` (or subpaths `@vishaljagamani/mailsense-types/accounts`, `@vishaljagamani/mailsense-types/emails`, etc.).

### 2.1 Accounts Module (`Backend/src/modules/accounts/`)
- **File**: `Backend/src/modules/accounts/account.types.ts`
  - *Before*:
    ```typescript
    import { GmailUserProfile } from 'integrations/gmail/gmail.types.js';
    import { OutlookUserProfile } from 'integrations/outlook/outlook.types.js';
    ```
  - *After*:
    ```typescript
    import {
        AccountAttributes,
        ACCOUNT_LAST_SYNC_STATUS,
        ACCOUNT_SYNC_JOB_STATUS,
        ACCOUNT_SYNC_JOB_TRIGGER_TYPE,
        SyncJobAttributes,
        GmailUserProfile,
        OutlookUserProfile,
    } from '@vishaljagamani/mailsense-types';
    ```

### 2.2 Emails Module (`Backend/src/modules/emails/`)
- **File**: `Backend/src/modules/emails/email.types.ts`
  - *Before*:
    ```typescript
    import { DATE_RANGE } from '@types';
    ```
  - *After*:
    ```typescript
    import { DATE_RANGE, EmailAttributes, SearchEmailsParams, GetAllEmailsFilters, SearchOtherContactsResponse, GetFiltersResponse } from '@vishaljagamani/mailsense-types';
    ```

### 2.3 Folders Module (`Backend/src/modules/folders/`)
- **File**: `Backend/src/modules/folders/folder.types.ts`
  - *Before*:
    ```typescript
    import { DATE_RANGE } from '@types';
    ```
  - *After*:
    ```typescript
    import { FolderKind, FolderRole, FolderAttributes, GetAllFoldersFilters, DATE_RANGE } from '@vishaljagamani/mailsense-types';
    ```

### 2.4 User Module (`Backend/src/modules/user/`)
- **File**: `Backend/src/modules/user/user.types.ts`
  - *After*:
    ```typescript
    import { UserDetailsObject, UpdatePasswordResponseObject } from '@vishaljagamani/mailsense-types';
    ```

### 2.5 Integrations (`Backend/src/integrations/`)
- **File**: `Backend/src/integrations/email/email.provider.types.ts`
  - *After*:
    ```typescript
    import {
        EmailSyncResult,
        IEmailTAuthToken,
        IEmailTUserProfile,
        IEmailTSendEmailResult,
        GmailUserProfile,
        OutlookUserProfile,
    } from '@vishaljagamani/mailsense-types';
    ```

### 2.6 Events (`Backend/src/core/events/`)
- **File**: `Backend/src/core/events/event.types.ts`
  - *After*:
    ```typescript
    import { SystemEvent, SyncCompletedPayload, EmailCreatedPayload, SystemEventPayloads } from '@vishaljagamani/mailsense-types/events';
    ```

### 2.7 Workers (`Backend/src/workers/`)
- **File**: `Backend/src/workers/worker.types.ts`
  - *After*:
    ```typescript
    import { SyncJobResult } from '@vishaljagamani/mailsense-types/workers';
    ```

---

## 3. Step 3: Obsolete Local Files Cleanup

After updating all import statements across `Backend/src`, remove the redundant local type files that have been centralized into `@vishaljagamani/mailsense-types`.

Execute in terminal inside `Backend/`:

```bash
# Remove duplicate core type files
rm -f src/core/types/common.types.ts
rm -f src/core/types/account.types.ts
rm -f src/core/types/email.types.ts
rm -f src/core/types/api.types.ts
```

> [!NOTE]
> Keep `Backend/src/core/types/express.d.ts` as it extends the global Express Request interface for backend middleware validation.

---

## 4. Step 4: Verification & Test Execution

Run the full validation suite in `Backend/` to ensure zero compilation regressions and complete test pass:

```bash
cd Backend

# 1. Run TypeScript type check
pnpm type-check

# 2. Run build step (tsc && tsc-alias)
pnpm build

# 3. Run unit & integration tests
pnpm test
```

---

## 5. Phase 6 Verification Checklist

- [ ] `Backend/package.json` contains `"@vishaljagamani/mailsense-types": "^1.0.0"`.
- [ ] Backend modules (`accounts`, `emails`, `folders`, `user`, `integrations`, `events`, `workers`) import types from `@vishaljagamani/mailsense-types`.
- [ ] Obsolete local files in `src/core/types/` removed.
- [ ] `pnpm type-check` returns 0 compilation errors.
- [ ] `pnpm build` succeeds cleanly.
- [ ] `pnpm test` passes 100% of backend tests.
