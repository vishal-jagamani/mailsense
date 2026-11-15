# Phase 7 Implementation Guide: Frontend Refactoring & Integration

## Overview

This document details the exact refactoring steps, dependency additions, import replacements, obsolete file cleanup, and verification commands for **Phase 7: Frontend Refactoring & Integration** of `@vishaljagamani/mailsense-types` into the `Frontend/` Next.js application of MailSense.

---

## 1. Step 1: Update `Frontend/package.json`

Add the `@vishaljagamani/mailsense-types` dependency to `Frontend/package.json`.

```json
{
  "dependencies": {
    "@vishaljagamani/mailsense-types": "^1.0.0"
  }
}
```

Run installation in the terminal:

```bash
cd Frontend
pnpm install
```

---

## 2. Step 2: Codebase Import Replacements in `Frontend/src`

Replace local type imports across shared and entity layers in the frontend app with imports from `@vishaljagamani/mailsense-types`.

### 2.1 Shared Types (`Frontend/src/shared/types/`)
- **File**: `Frontend/src/shared/types/api.types.ts` (Obsolete)
  - *Replace with*:
    ```typescript
    import { APIResponse, PaginatedDataResponse, UpdateAPIResponse } from '@vishaljagamani/mailsense-types/common';
    ```

- **File**: `Frontend/src/shared/types/filter.types.ts` (Obsolete)
  - *Replace with*:
    ```typescript
    import { DATE_RANGE, FilterOptionType, Filter, FilterOption } from '@vishaljagamani/mailsense-types/common';
    ```

- **File**: `Frontend/src/shared/types/settings.types.ts` (Obsolete)
  - *Replace with*:
    ```typescript
    import { ProfileSettingsDataObject, UpdateUserProfileSettingsResponse } from '@vishaljagamani/mailsense-types/user';
    ```

> [!NOTE]
> Retain `Frontend/src/shared/types/sidebar.types.ts` as it defines React UI layout types (`NavMainItem`, `SidebarData`) using `LucideIcon`.

### 2.2 Account Entity (`Frontend/src/entities/account/model/`)
- **File**: `Frontend/src/entities/account/model/account.types.ts`
  - *Before*:
    ```typescript
    export enum ACCOUNT_PROVIDER { GMAIL = 'gmail', OUTLOOK = 'outlook' }
    export interface AccountProviders { ... }
    export interface AccountAttributes { ... }
    export interface GetAccountsResponse { ... }
    ```
  - *After*:
    ```typescript
    export {
        AccountProvider as ACCOUNT_PROVIDER,
        AccountProviderType as AccountProviders,
        AccountAttributes,
        GetAccountsResponse,
    } from '@vishaljagamani/mailsense-types/accounts';
    ```

### 2.3 Email Entity (`Frontend/src/entities/email/model/`)
- **File**: `Frontend/src/entities/email/model/email.types.ts`
  - *After*:
    ```typescript
    export {
        Email,
        FetchEmailRequestOptions,
        ComposeEmailRequestBody,
        SearchOtherContactsResponse,
        GetFiltersResponse,
    } from '@vishaljagamani/mailsense-types/emails';
    ```

### 2.4 Folder Entity (`Frontend/src/entities/folder/model/`)
- **File**: `Frontend/src/entities/folder/model/folder.types.ts`
  - *After*:
    ```typescript
    import {
        FolderKind,
        FolderRole,
        FolderAttributes,
        GetAllFoldersRequestOptions,
        CreateFolderBodyParams,
    } from '@vishaljagamani/mailsense-types/folders';

    export { FolderKind, FolderRole, FolderAttributes, GetAllFoldersRequestOptions, CreateFolderBodyParams };

    // Retain UI-specific React component props
    export interface RenameFolderState {
        renameFolderFlag: boolean;
        renameFolderId: string;
        renameFolderValue: string;
        setRenameFolderFlag: (value: boolean) => void;
        setRenameFolderId: (id: string) => void;
        setRenameFolderValue: (value: string) => void;
        handleUpdateFolder: (id: string, body: CreateFolderBodyParams) => void;
    }

    export interface FolderBodyProps {
        tableData: FolderAttributes[];
        size: number;
        page: number;
        total: number;
        onPageChange: (page: number) => void;
        onPageSizeChange: (size: number) => void;
        renameState: RenameFolderState;
        deleteFolder: (id: string) => void;
    }
    ```

### 2.5 User Entity (`Frontend/src/entities/user/model/`)
- **File**: `Frontend/src/entities/user/model/user.types.ts`
  - *After*:
    ```typescript
    export { User } from '@vishaljagamani/mailsense-types/user';
    ```

---

## 3. Step 3: Obsolete Local Files Cleanup

Remove redundant shared files in `Frontend/src/shared/types/` that have been completely replaced:

```bash
cd Frontend
rm -f src/shared/types/api.types.ts
rm -f src/shared/types/filter.types.ts
rm -f src/shared/types/settings.types.ts
```

---

## 4. Step 4: Verification & Next.js Build Execution

Run dev server and production build validation in `Frontend/`:

```bash
cd Frontend

# 1. Test development compilation
pnpm dev --help # Or run pnpm dev to verify Turbo/Next compilation

# 2. Test production build
pnpm build
```

---

## 5. Phase 7 Verification Checklist

- [ ] `Frontend/package.json` includes `"@vishaljagamani/mailsense-types": "^1.0.0"`.
- [ ] Shared type utilities import from `@vishaljagamani/mailsense-types/common` and `@vishaljagamani/mailsense-types/user`.
- [ ] Account, Email, Folder, User entities re-export shared models from `@vishaljagamani/mailsense-types`.
- [ ] UI-only React component props (`RenameFolderState`, `FolderBodyProps`, `NavMainItem`) retained locally.
- [ ] Obsolete files `api.types.ts`, `filter.types.ts`, `settings.types.ts` in `shared/types/` removed.
- [ ] `pnpm build` in `Frontend/` compiles with 0 Next.js / TypeScript errors.
