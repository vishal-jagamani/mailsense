# Phase 2 Implementation Guide: Base Infrastructure Module (`common`)

## Overview

This document provides the exact source code definitions, file locations, exports, and verification steps for **Phase 2: Base Infrastructure Module (`common`)** of the `@mailsense/types` library.

The `common` module centralizes all generic API wrappers, pagination envelope structures, query filters, date range enums, and shared request/response models.

---

## 1. Directory Structure for Module `common`

```
src/common/
├── common.constants.ts
├── common.enums.ts
├── common.interfaces.ts
├── common.types.ts
└── index.ts
```

---

## 2. File Specifications & Exact Implementation Code

### 2.1 `common.constants.ts`
Location: `src/common/common.constants.ts`

```typescript
// Default pagination limit for list requests across APIs
export const DEFAULT_PAGE_SIZE = 20;

// Default page index (1-based pagination)
export const DEFAULT_PAGE = 1;

// Maximum allowed page size for bulk API endpoints
export const MAX_PAGE_SIZE = 100;
```

---

### 2.2 `common.enums.ts`
Location: `src/common/common.enums.ts`

```typescript
// Supported date range filters for email and folder queries
export enum DATE_RANGE {
    TODAY = 'today',
    LAST_WEEK = 'last_week',
    LAST_MONTH = 'last_month',
    LAST_3_MONTHS = 'last_3_months',
    ALL_TIME = 'all_time',
}

// Supported control types for UI filter options
export enum FilterOptionType {
    STRING = 'string',
    TOGGLE = 'toggle',
    DROPDOWN = 'dropdown',
}
```

---

### 2.3 `common.interfaces.ts`
Location: `src/common/common.interfaces.ts`

```typescript
import { DATE_RANGE, FilterOptionType } from './common.enums.js';

// Generic API response wrapper for payload object T
export interface APIResponse<T> {
    status: boolean;
    message: string;
    data: T;
}

// Generic paginated response wrapper for list requests containing array T
export interface PaginatedDataResponse<T> {
    data: T[];
    size: number;
    page: number;
    total: number;
}

// Standard API response envelope for mutation/update operations
export interface UpdateAPIResponse {
    status: boolean;
    message: string;
}

// Standard API response envelope for generic success operations
export interface SuccessAPIResponse {
    status: boolean;
    message: string;
}

// Shared search and filter options interface used across frontend & backend
export interface Filter {
    searchText?: string | undefined;
    accountId?: string[] | undefined;
    dateRange?: DATE_RANGE | undefined;
    folders?: string[] | undefined;
    unread?: boolean | undefined;
}

// Metadata definition for individual filter option choices
export interface FilterOptionData {
    id: string;
    name: string;
    label: string;
    selectedValue: string | boolean;
    provider?: string;
}

// Configuration payload for rendering filter controls
export interface FilterOption {
    id: number;
    name: string;
    label: string;
    type: FilterOptionType;
    data: FilterOptionData[] | FilterOptionData;
}
```

---

### 2.4 `common.types.ts`
Location: `src/common/common.types.ts`

```typescript
// Common pagination request parameters
export type PaginationQueryParams = {
    page?: number;
    size?: number;
};

// Generic ID type alias for entity identifiers
export type EntityId = string;

// Utility type for Nullable values
export type Nullable<T> = T | null;
```

---

### 2.5 `index.ts` (Module Barrel Export)
Location: `src/common/index.ts`

```typescript
export * from './common.constants.js';
export * from './common.enums.js';
export * from './common.interfaces.js';
export * from './common.types.js';
```

---

## 3. Step-by-Step Execution Guide

### Step 1: Create `src/common/` Directory
Execute in terminal inside the `mailsense-types` repository:

```bash
mkdir -p src/common
```

### Step 2: Create Module Files
Create the 5 files defined above (`common.constants.ts`, `common.enums.ts`, `common.interfaces.ts`, `common.types.ts`, `index.ts`) in `src/common/`.

### Step 3: Verify TypeScript Build
Run build and type check commands:

```bash
pnpm type-check
pnpm build
```

---

## 4. Phase 2 Verification Checklist

- [ ] Directory `src/common/` exists with all 5 files.
- [ ] `DATE_RANGE` and `FilterOptionType` enums exported cleanly from `common.enums.ts`.
- [ ] `APIResponse<T>`, `PaginatedDataResponse<T>`, `UpdateAPIResponse`, `SuccessAPIResponse`, `Filter`, `FilterOption` exported cleanly from `common.interfaces.ts`.
- [ ] `DEFAULT_PAGE_SIZE`, `DEFAULT_PAGE`, `MAX_PAGE_SIZE` exported cleanly from `common.constants.ts`.
- [ ] `index.ts` barrel exports all files using ES module syntax (`.js` extensions in relative specifiers).
- [ ] `pnpm type-check` executes with 0 errors.
- [ ] `pnpm build` produces `./dist/common/index.js`, `./dist/common/index.cjs`, and `./dist/common/index.d.ts`.
