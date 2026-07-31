# Frontend Background Sync - Phase 2 Implementation Plan

This document details the step-by-step implementation for **Phase 2: Frontend Entity Types & Query Polling** of the MailSense Frontend Background Sync system.

---

## Goal Description

Establish the core frontend foundation for background sync tracking. This phase re-exports shared account sync interfaces and attributes from `@mailsense/types` in the frontend `account` entity model and configures dynamic, non-blocking TanStack Query auto-polling (3-second interval) on account list and account detail queries while any background synchronization task (`syncInProgress === true`) is active.

---

## User Review Required

> [!IMPORTANT]
> **TanStack Query Dynamic Refetching**
> - `useGetAccountsQuery` dynamically checks if any account in the returned list has `syncInProgress === true`. If true, it polling-refetches every 3,000 ms (3 seconds) until all syncs finish, then automatically stops polling (`refetchInterval: false`).
> - `useGetAccountDetailsQuery` applies the same dynamic polling logic for single account detail views.

---

## Proposed Changes

### Component: Frontend Entities Layer (`src/entities/account/`)

#### [MODIFY] [account.types.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/entities/account/model/account.types.ts)
- Re-export `AccountAttributes`, `UserSettings`, `UserAccountSettings`, `UserAccountSyncSettings`, `ACCOUNT_SYNC_MODE`, and `ACCOUNT_LAST_SYNC_STATUS` directly from `@mailsense/types`.

---

### Component: Frontend Accounts Feature Layer (`src/features/accounts/`)

#### [MODIFY] [accounts.queries.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/accounts/api/accounts.queries.ts)
- Update `useGetAccountsQuery` with dynamic `refetchInterval` (3s polling when any account has `syncInProgress === true`).
- Update `useGetAccountDetailsQuery` with dynamic `refetchInterval` (3s polling when `syncInProgress === true`).

---

## File Contents

Below are the complete file contents required for Phase 2 implementation.

### 1. `src/entities/account/model/account.types.ts`

```typescript
import {
    ACCOUNT_LAST_SYNC_STATUS,
    ACCOUNT_SYNC_MODE,
    AccountAttributes,
    UserAccountSettings,
    UserAccountSyncSettings,
    UserSettings,
} from '@mailsense/types';

export { ACCOUNT_LAST_SYNC_STATUS, ACCOUNT_SYNC_MODE, AccountAttributes, UserAccountSettings, UserAccountSyncSettings, UserSettings };

export interface AccountProviders {
    id: number;
    name: string;
    displayName: string;
}
```

---

### 2. `src/features/accounts/api/accounts.queries.ts`

```typescript
import { AccountProviders } from '@entities/account';
import { AccountAttributes, UpdateAPIResponse } from '@mailsense/types';
import { QUERY_KEYS } from '@shared/api';
import { useQuery, useQueryClient, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { connectAccount, getAccountDetails, getAccountProvider, getAccounts, syncAllAccounts } from './accounts.api';

type ConnectAccountResult = Awaited<ReturnType<typeof connectAccount>>;

type Options = Omit<UseQueryOptions<ConnectAccountResult, Error, ConnectAccountResult, [string, string]>, 'queryKey' | 'queryFn'>;

export const useGetAccountsQuery = (userId: string, options?: Options): UseQueryResult<AccountAttributes[]> => {
    return useQuery({
        queryKey: [QUERY_KEYS.ACCOUNTS, userId],
        queryFn: () => getAccounts(),
        refetchInterval: (query) => {
            const data = query.state.data as AccountAttributes[] | undefined;
            if (Array.isArray(data) && data.some((acc) => acc.syncInProgress)) {
                return 3000;
            }
            return false;
        },
        ...options,
    });
};

export const useGetAccountDetailsQuery = (accountId: string, options?: Options): UseQueryResult<AccountAttributes> => {
    return useQuery({
        queryKey: [QUERY_KEYS.ACCOUNTS, accountId],
        queryFn: () => getAccountDetails(accountId),
        refetchInterval: (query) => {
            const data = query.state.data as AccountAttributes | undefined;
            if (data?.syncInProgress) {
                return 3000;
            }
            return false;
        },
        ...options,
    });
};

export const useAccountQuery = (provider: string, options?: Options) => {
    return useQuery({
        queryKey: [QUERY_KEYS.ACCOUNTS, provider],
        queryFn: () => connectAccount(provider),
        staleTime: 5 * 60 * 1000,
        ...options,
    });
};

export const useAccountProviderQuery = (): UseQueryResult<AccountProviders[]> => {
    return useQuery({ queryKey: [QUERY_KEYS.ACCOUNT_PROVIDERS], queryFn: () => getAccountProvider(), staleTime: 5 * 60 * 1000 });
};

export const useSyncAllAccounts = () => {
    const queryClient = useQueryClient();

    const handleSyncAllAccounts = async (userId: string): Promise<UpdateAPIResponse> => {
        try {
            const result = await syncAllAccounts(userId);
            toast.success(result.message, { duration: 3000 });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNTS] });
            return result;
        } catch (error) {
            console.error('Sync all accounts error:', error);
            throw error;
        }
    };

    return { syncAllAccounts: handleSyncAllAccounts };
};
```

---

## Verification Plan

### Automated Verification
1. Run TypeScript check in Frontend:
   ```bash
   pnpm type-check
   ```
2. Run ESLint checks in Frontend:
   ```bash
   pnpm lint
   ```

### Manual Verification
1. Trigger manual sync for an account -> Verify `useGetAccountsQuery` initiates 3-second refetch polling while `syncInProgress` is `true`.
2. Observe network requests -> Verify polling stops automatically once `syncInProgress` transitions to `false`.
