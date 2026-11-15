# Frontend Background Sync - Phase 4 Implementation Plan

This document details the step-by-step implementation for **Phase 4: Card Quick Action & UI Polish (`/accounts`)** of the MailSense Frontend Background Sync system.

---

## Goal Description

Enhance the `/accounts` page cards with quick-access settings and live sync indicators. This phase introduces an `AccountSettingsModal` component accessible via a gear icon on each account card, animates the refresh icon during active background syncs (`syncInProgress === true`), and displays an error indicator tooltip with `lastSyncError` context whenever an account sync fails (`lastSyncStatus === 'FAILED'`).

---

## User Review Required

> [!IMPORTANT]
> **Account Card UI & Interactive Sync Indicators**
> - **Gear Icon Action**: Clicking the gear icon opens `AccountSettingsModal` directly from the `/accounts` page for immediate per-account interval and auto-sync adjustments.
> - **Live Sync Progress**: The `RefreshCw` icon animates with `animate-spin` and displays a pulse badge while `account.syncInProgress === true`.
> - **Error Context Tooltip**: When an account sync encounters an error (`lastSyncStatus === 'FAILED'`), an alert triangle icon is rendered alongside a Radix Tooltip displaying `account.lastSyncError`.

---

## Proposed Changes

### Component: Frontend Accounts Feature Layer (`src/features/accounts/`)

#### [MODIFY] [accounts.api.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/accounts/api/accounts.api.ts)
- Add `updateAccountSettings(accountId, settings)` calling `PATCH /accounts/settings/:accountId`.

#### [MODIFY] [accounts.mutations.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/accounts/api/accounts.mutations.ts)
- Add `useUpdateAccountSettingsMutation` with automatic `QUERY_KEYS.ACCOUNTS` cache invalidation.

#### [NEW] [AccountSettingsModal.tsx](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/accounts/components/account-card/AccountSettingsModal.tsx)
- Create dialog modal for editing an account's `syncEnabled`, `syncInterval` (5m, 10m, 15m, 30m, 60m, 360m, etc.), and `active` state.

#### [MODIFY] [useAccountCardActions.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/accounts/hooks/useAccountCardActions.ts)
- Add `isSettingsModalOpen` state and handlers.
- Evaluate `isSyncingAccount = account.syncInProgress || isSyncingPending`.

#### [MODIFY] [AccountCardActionButtons.tsx](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/accounts/components/account-card/AccountCardActionButtons.tsx)
- Render **Settings** gear icon button opening `AccountSettingsModal`.
- Animate `RefreshCw` spin icon when `account.syncInProgress === true`.
- Render error alert triangle with tooltip when `account.lastSyncStatus === ACCOUNT_LAST_SYNC_STATUS.FAILED`.

---

## File Contents

Below are the complete file modifications required for Phase 4 implementation.

### 1. `src/features/accounts/api/accounts.api.ts`

```typescript
import { AccountProviders } from '@entities/account';
import { AccountAttributes } from '@mailsense/types';
import { ACCOUNTS_API_ENDPOINTS, axiosClient } from '@shared/api';

export async function getAccountProvider(): Promise<AccountProviders[]> {
    const { data } = await axiosClient.get<AccountProviders[]>(ACCOUNTS_API_ENDPOINTS.PROVIDERS_LIST);
    return data;
}

export async function getAccountDetails(accountId: string): Promise<AccountAttributes> {
    const { data } = await axiosClient.get<AccountAttributes>(ACCOUNTS_API_ENDPOINTS.DETAILS(accountId));
    return data;
}

export async function getAccounts() {
    const { data } = await axiosClient.get<AccountAttributes[]>(ACCOUNTS_API_ENDPOINTS.LIST_BY_USER);
    return data;
}

export async function connectAccount(provider: string) {
    const { data } = await axiosClient.get(ACCOUNTS_API_ENDPOINTS.CONNECT(provider));
    return data;
}

export async function syncAccount(accountId: string) {
    const { data } = await axiosClient.get(ACCOUNTS_API_ENDPOINTS.SYNC(accountId));
    return data;
}

export async function syncAllAccounts(userId: string) {
    const { data } = await axiosClient.get(ACCOUNTS_API_ENDPOINTS.SYNC_ALL, {
        params: {
            userId,
        },
    });
    return data;
}

export async function removeAccount(accountId: string) {
    const { data } = await axiosClient.delete(ACCOUNTS_API_ENDPOINTS.DELETE(accountId));
    return data;
}

export async function enableAccount(accountId: string, active: boolean) {
    const { data: response } = await axiosClient.patch(ACCOUNTS_API_ENDPOINTS.ENABLE(accountId), { active });
    return response;
}

export async function updateAccountSettings(
    accountId: string,
    settings: { syncEnabled?: boolean; syncInterval?: number; active?: boolean },
) {
    const { data: response } = await axiosClient.patch(ACCOUNTS_API_ENDPOINTS.UPDATE_SETTINGS(accountId), settings);
    return response;
}
```

---

### 2. `src/features/accounts/api/accounts.mutations.ts`

```typescript
import { UpdateAPIResponse } from '@mailsense/types';
import { QUERY_KEYS } from '@shared/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { connectAccount, enableAccount, removeAccount, syncAccount, updateAccountSettings } from './accounts.api';

export const useConnectAccountMutation = () => {
    return useMutation<Awaited<ReturnType<typeof connectAccount>>, Error, string>({
        mutationFn: (provider) => connectAccount(provider),
    });
};

export const useSyncAccountMutation = () => {
    const queryClient = useQueryClient();
    return useMutation<UpdateAPIResponse, Error, string>({
        mutationFn: (accountId) => syncAccount(accountId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNTS] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNT_PROVIDERS] });
        },
    });
};

export const useEnableAccountMutation = () => {
    const queryClient = useQueryClient();
    return useMutation<UpdateAPIResponse, Error, { accountId: string; active: boolean }>({
        mutationFn: ({ accountId, active }) => enableAccount(accountId, active),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNTS] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNT_PROVIDERS] });
        },
    });
};

export const useRemoveAccountMutation = () => {
    const queryClient = useQueryClient();
    return useMutation<UpdateAPIResponse, Error, string>({
        mutationFn: (accountId) => removeAccount(accountId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNTS] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNT_PROVIDERS] });
        },
    });
};

export const useUpdateAccountSettingsMutation = () => {
    const queryClient = useQueryClient();
    return useMutation<
        UpdateAPIResponse,
        Error,
        { accountId: string; settings: { syncEnabled?: boolean; syncInterval?: number; active?: boolean } }
    >({
        mutationFn: ({ accountId, settings }) => updateAccountSettings(accountId, settings),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNTS] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_SYNC_SETTINGS] });
        },
    });
};
```

---

### 3. `src/features/accounts/components/account-card/AccountSettingsModal.tsx`

```tsx
'use client';

import React, { useState } from 'react';
import { useUpdateAccountSettingsMutation } from '@features/accounts/api/accounts.mutations';
import { AccountAttributes } from '@mailsense/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@shared/ui/dialog';
import { Label } from '@shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';
import { Switch } from '@shared/ui/switch';
import { Button } from '@shared/ui/button';
import { toast } from 'sonner';

interface AccountSettingsModalProps {
    account: AccountAttributes;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const SYNC_INTERVAL_OPTIONS = [
    { label: 'Every 5 minutes', value: 5 },
    { label: 'Every 10 minutes', value: 10 },
    { label: 'Every 15 minutes', value: 15 },
    { label: 'Every 30 minutes', value: 30 },
    { label: 'Every hour', value: 60 },
    { label: 'Every 6 hours', value: 360 },
    { label: 'Every 12 hours', value: 720 },
    { label: 'Daily (24 hours)', value: 1440 },
];

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({ account, open, onOpenChange }) => {
    const [syncEnabled, setSyncEnabled] = useState(account.syncEnabled ?? true);
    const [syncInterval, setSyncInterval] = useState(account.syncInterval ?? 15);
    const updateSettingsMutation = useUpdateAccountSettingsMutation();

    const handleSave = async () => {
        try {
            await updateSettingsMutation.mutateAsync({
                accountId: account._id,
                settings: {
                    syncEnabled,
                    syncInterval,
                },
            });
            toast.success('Account settings saved');
            onOpenChange(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update account settings');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Account Sync Settings</DialogTitle>
                    <DialogDescription>
                        Adjust background synchronization parameters for {account.emailAddress}.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Auto Sync Toggle */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Account Auto-Sync</Label>
                            <p className="text-xs text-muted-foreground">Enable automatic background fetches for this mailbox.</p>
                        </div>
                        <Switch checked={syncEnabled} onCheckedChange={setSyncEnabled} />
                    </div>

                    {/* Sync Interval Selector */}
                    <div className="flex items-center justify-between pt-2">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Sync Frequency</Label>
                            <p className="text-xs text-muted-foreground">How often background sync runs.</p>
                        </div>
                        <Select
                            value={String(syncInterval)}
                            onValueChange={(val) => setSyncInterval(parseInt(val, 10))}
                            disabled={!syncEnabled}
                        >
                            <SelectTrigger className="w-44">
                                <SelectValue placeholder="Select interval" />
                            </SelectTrigger>
                            <SelectContent>
                                {SYNC_INTERVAL_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={String(opt.value)}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={updateSettingsMutation.isPending}>
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
```

---

### 4. `src/features/accounts/hooks/useAccountCardActions.ts`

```typescript
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AccountAttributes } from '@mailsense/types';
import { UI_CONSTANTS } from '@shared/constants';
import { useEnableAccountMutation, useRemoveAccountMutation, useSyncAccountMutation } from '../api/accounts.mutations';

export const useAccountCardActions = (account: AccountAttributes) => {
    const [accountEnabled, setAccountEnabled] = useState(account.active);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    const { mutateAsync: removeAccount, isPending: isRemovingAccount, error: removeAccountError } = useRemoveAccountMutation();
    const { mutateAsync: syncAccount, isPending: isSyncingMutationPending, error: syncAccountError } = useSyncAccountMutation();
    const { mutate: enableAccount, isPending: isEnablingAccount, data: enableAccountData, error: enableAccountError } = useEnableAccountMutation();

    const isSyncingAccount = Boolean(account.syncInProgress || isSyncingMutationPending);

    useEffect(() => {
        setAccountEnabled(account.active);
    }, [account.active]);

    useEffect(() => {
        if (enableAccountData) {
            toast.success(enableAccountData.message, { duration: UI_CONSTANTS.TOAST.DURATION });
        }

        if (enableAccountError) {
            toast.error(enableAccountError.message, { duration: UI_CONSTANTS.TOAST.DURATION });
            setAccountEnabled(account.active);
        }
    }, [account.active, enableAccountData, enableAccountError]);

    const toggleAccountEnabled = (active: boolean) => {
        setAccountEnabled(active);
        enableAccount({ accountId: account._id, active });
    };

    const syncCurrentAccount = async () => {
        await syncAccount(account._id);
    };

    const removeCurrentAccount = async () => {
        await removeAccount(account._id);
    };

    return {
        accountEnabled,
        toggleAccountEnabled,
        syncCurrentAccount,
        removeCurrentAccount,
        isSettingsModalOpen,
        setIsSettingsModalOpen,
        isEnablingAccount,
        isSyncingAccount,
        isRemovingAccount,
        enableAccountError,
        syncAccountError,
        removeAccountError,
    };
};
```

---

### 5. `src/features/accounts/components/account-card/AccountCardActionButtons.tsx`

```tsx
'use client';

import { AlertTriangle, CircleMinus, RefreshCw, Settings } from 'lucide-react';
import React from 'react';

import { useAccountCardActions } from '@features/accounts/hooks/useAccountCardActions';
import { ACCOUNT_LAST_SYNC_STATUS, AccountAttributes } from '@mailsense/types';
import APILoader from '@shared/components/apiLoader';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@shared/ui/alert-dialog';
import { Switch } from '@shared/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/tooltip';
import { formatEpochTimeToString } from '@shared/utils/formatter';
import { AccountSettingsModal } from './AccountSettingsModal';

interface AccountCardActionButtonsProps {
    account: AccountAttributes;
}

const AccountCardActionButtons: React.FC<AccountCardActionButtonsProps> = ({ account }) => {
    const {
        accountEnabled,
        toggleAccountEnabled,
        syncCurrentAccount,
        removeCurrentAccount,
        isSettingsModalOpen,
        setIsSettingsModalOpen,
        isEnablingAccount,
        isSyncingAccount,
        isRemovingAccount,
    } = useAccountCardActions(account);

    const isBusy = isEnablingAccount || isRemovingAccount;
    const isSyncFailed = account.lastSyncStatus === ACCOUNT_LAST_SYNC_STATUS.FAILED;

    return (
        <div className="flex w-full flex-col gap-1">
            <APILoader show={isBusy} size="xs" />
            <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-bold">{account.emailAddress}</p>
                <Tooltip>
                    <TooltipTrigger>
                        <Switch id="enable-account" checked={accountEnabled} onCheckedChange={(value) => toggleAccountEnabled(value)} size="sm" />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="text-md font-semibold">{account?.active ? 'Disable Account' : 'Enable Account'}</p>
                    </TooltipContent>
                </Tooltip>
            </div>
            <div className="relative flex w-full items-center justify-between text-nowrap">
                <div className="flex items-center gap-1.5">
                    <p className="text-muted-foreground text-xs font-semibold">
                        {isSyncingAccount ? (
                            <span className="animate-pulse text-green-500 delay-100">Syncing...</span>
                        ) : account.lastSyncedAt ? (
                            `Last synced ${formatEpochTimeToString(account.lastSyncedAt)} ago`
                        ) : (
                            'Never synced'
                        )}
                    </p>
                    {isSyncFailed && (
                        <Tooltip>
                            <TooltipTrigger>
                                <AlertTriangle size={14} className="text-amber-500 hover:cursor-pointer" />
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs bg-destructive text-destructive-foreground">
                                <p className="text-xs font-medium">
                                    {account.lastSyncError || 'Background sync failed. Click sync to retry.'}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>

                <div className="flex gap-2">
                    <Tooltip>
                        <TooltipTrigger>
                            <Settings
                                size={16}
                                className="text-muted-foreground hover:text-foreground hover:cursor-pointer transition-colors"
                                onClick={() => setIsSettingsModalOpen(true)}
                            />
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p className="text-md font-semibold">Account Settings</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger>
                            <RefreshCw
                                size={16}
                                className={isSyncingAccount ? 'animate-spin hover:cursor-pointer text-primary' : 'hover:cursor-pointer'}
                                onClick={syncCurrentAccount}
                            />
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p className="text-md font-semibold">{isSyncingAccount ? 'Syncing' : 'Sync'}</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <CircleMinus size={16} className="text-red-500 hover:cursor-pointer" />
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete your account and remove your data from our
                                            servers.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="cursor-pointer font-semibold">Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => removeCurrentAccount()}
                                            className="text-primary cursor-pointer bg-red-600 font-semibold hover:bg-red-500"
                                        >
                                            Remove Account
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p className="text-md font-semibold">Remove</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </div>

            <AccountSettingsModal account={account} open={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen} />
        </div>
    );
};

export default AccountCardActionButtons;
```

---

## Verification Plan

### Automated Verification
1. Run TypeScript check in Frontend:
   ```bash
   pnpm type-check
   ```
2. Run ESLint check in Frontend:
   ```bash
   pnpm lint
   ```

### Manual Verification
1. Click Gear Icon on any account card -> Verify `AccountSettingsModal` opens cleanly.
2. Toggle Auto-Sync or change interval to 5m -> Click Save -> Verify API request `PATCH /accounts/settings/:accountId` succeeds and account updates.
3. Trigger Manual Sync -> Verify `RefreshCw` spins and pulse text displays `Syncing...`.
