# Frontend Background Sync - Phase 3 Implementation Plan

This document details the step-by-step implementation for **Phase 3: Centralized Account Settings Tab (`/settings/account`)** of the MailSense Frontend Background Sync system.

---

## Goal Description

Build the centralized Account Sync Settings page inside the `/settings` route (`/settings/account`). This phase provides a unified management view where users can toggle global auto-sync, select background sync mode (`SAME_FOR_ALL` vs `CUSTOM_PER_ACCOUNT`), set global default sync intervals, and manage individual per-account sync switches and intervals in a clear management table.

---

## User Review Required

> [!IMPORTANT]
> **Centralized Settings & Real-Time Sync Alignment**
> - **Global Auto-Sync Switch**: Disabling `globalAutoSync` updates user settings and immediately stops all BullMQ background repeatable schedules on the backend.
> - **Sync Mode Switcher**: Selecting `SAME_FOR_ALL` applies the `globalSyncInterval` across all accounts and disables per-account interval dropdowns. Selecting `CUSTOM_PER_ACCOUNT` enables individual per-account interval control.
> - **Real-Time TanStack Query Synchronization**: Modifying global settings or account sync settings invalidates both `USER_SYNC_SETTINGS` and `ACCOUNTS` query caches to keep the UI immediately in sync.

---

## Proposed Changes

### Component: Shared Frontend Layer (`src/shared/`)

#### [MODIFY] [endpoints.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/shared/api/endpoints.ts)
- Add `USER_SETTINGS: '/users/settings'` to `SETTINGS_API_ENDPOINTS`.
- Add `UPDATE_SETTINGS: (accountId: string) => '/accounts/settings/${accountId}'` to `ACCOUNTS_API_ENDPOINTS`.

#### [MODIFY] [query-keys.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/shared/api/query-keys.ts)
- Add `USER_SYNC_SETTINGS: 'user-sync-settings'` to `QUERY_KEYS`.

#### [MODIFY] [settings.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/shared/constants/settings.ts)
- Ensure `SETTINGS_OPTIONS` includes active entry for `account` tab (`/settings/account`).

---

### Component: Frontend Settings Feature Layer (`src/features/settings/`)

#### [NEW] [settings.api.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/settings/api/settings.api.ts)
- Implement `getUserSettings()` calling `GET /users/settings`.
- Implement `updateUserSettings(payload)` calling `PATCH /users/settings`.

#### [NEW] [settings.queries.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/settings/api/settings.queries.ts)
- Implement `useGetUserSettingsQuery(userId)` hook.
- Implement `useUpdateUserSettingsMutation()` hook with toast notifications and query invalidation (`QUERY_KEYS.USER_SYNC_SETTINGS` & `QUERY_KEYS.ACCOUNTS`).

#### [NEW] [index.tsx (Account Settings Page)](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/settings/pages/account/index.tsx)
- Create `AccountSettings` component rendering:
  1. **Global Configuration Card**: Controls for `globalAutoSync`, `syncMode` selector (`SAME_FOR_ALL` vs `CUSTOM_PER_ACCOUNT`), `globalSyncInterval` select dropdown, and `defaultSyncInterval` select dropdown.
  2. **Accounts Sync Overview List**: Table/list of connected accounts with provider badge, email address, `syncEnabled` switch, `syncInterval` dropdown, last sync status badge, and manual trigger action button.

#### [MODIFY] [index.tsx (Settings Tab Container)](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/settings/pages/index.tsx)
- Render Radix `Tabs` container connecting **Profile** (`/settings/profile`) and **Account Sync** (`/settings/account`) views.

---

## File Contents

Below are the complete file modifications required for Phase 3 implementation.

### 1. `src/shared/api/endpoints.ts`

```typescript
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const AUTH0_URLS = {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    CALLBACK: '/auth/callback',
    PROFILE: '/auth/profile',
} as const;

export const AUTH_API_ENDPOINTS = {
    PROFILE: '/profile',
} as const;

export const ACCOUNTS_API_ENDPOINTS = {
    PROVIDERS_LIST: '/accounts/providers/list',
    DETAILS: (accountId: string) => `/accounts/${accountId}`,
    LIST_BY_USER: '/accounts/list/all',
    CONNECT: (provider: string) => `/accounts/connect/${provider}`,
    SYNC: (accountId: string) => `/accounts/sync/${accountId}`,
    SYNC_ALL: '/accounts/sync-all',
    DELETE: (accountId: string) => `/accounts/${accountId}`,
    ENABLE: (accountId: string) => `/accounts/enable/${accountId}`,
    UPDATE_SETTINGS: (accountId: string) => `/accounts/settings/${accountId}`,
} as const;

export const EMAILS_API_ENDPOINTS = {
    LIST: '/emails/list',
    SEARCH: '/emails/search',
    FILTERS: '/emails/filters',
    DELETE: '/emails/delete',
    DETAILS: (emailId: string) => `/emails/details/${emailId}`,
    ARCHIVE: '/emails/archive',
    STAR: '/emails/star',
    UNREAD: '/emails/unread',
    COMPOSE: '/emails/compose',
    SEARCH_OTHER_CONTACTS: '/emails/searchOtherContacts',
} as const;

export const FOLDER_API_ENDPOINTS = {
    GET_ALL_FOLDERS: '/folders/list',
    FOLDERS: '/folders',
} as const;

export const SETTINGS_API_ENDPOINTS = {
    USERS: '/users',
    CHANGE_PASSWORD: '/users/change-password',
    USER_SETTINGS: '/users/settings',
} as const;
```

---

### 2. `src/shared/api/query-keys.ts`

```typescript
export const QUERY_KEYS = {
    AUTH: 'auth',
    ACCOUNTS: 'accounts',
    ACCOUNT_PROVIDERS: 'account-providers',
    ACCOUNT_DETAILS: 'account-details',
    EMAIL: 'email',
    USER_PROFILE_SETTINGS: 'user-profile-settings',
    USER_SYNC_SETTINGS: 'user-sync-settings',
};

export const EMAILS = 'emails';

export const EMAIL_FILTERS = 'email-filters';

export const FOLDER_KEYS = {
    FOLDERS: 'folders',
};
```

---

### 3. `src/features/settings/api/settings.api.ts`

```typescript
import { APIResponse, UserSettings } from '@mailsense/types';
import { api, SETTINGS_API_ENDPOINTS } from '@shared/api';

export const getUserSettings = async (): Promise<UserSettings> => {
    const response = await api.get<APIResponse<UserSettings>>(SETTINGS_API_ENDPOINTS.USER_SETTINGS);
    return response.data.data;
};

export const updateUserSettings = async (payload: Partial<UserSettings>): Promise<UserSettings> => {
    const response = await api.patch<APIResponse<UserSettings>>(SETTINGS_API_ENDPOINTS.USER_SETTINGS, payload);
    return response.data.data;
};
```

---

### 4. `src/features/settings/api/settings.queries.ts`

```typescript
import { UserSettings } from '@mailsense/types';
import { QUERY_KEYS } from '@shared/api';
import { useMutation, useQuery, useQueryClient, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getUserSettings, updateUserSettings } from './settings.api';

type Options = Omit<UseQueryOptions<UserSettings, Error, UserSettings, [string]>, 'queryKey' | 'queryFn'>;

export const useGetUserSettingsQuery = (userId?: string, options?: Options): UseQueryResult<UserSettings> => {
    return useQuery({
        queryKey: [QUERY_KEYS.USER_SYNC_SETTINGS],
        queryFn: () => getUserSettings(),
        enabled: !!userId,
        ...options,
    });
};

export const useUpdateUserSettingsMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: Partial<UserSettings>) => updateUserSettings(payload),
        onSuccess: () => {
            toast.success('Sync settings updated successfully');
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_SYNC_SETTINGS] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNTS] });
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update sync settings');
        },
    });
};
```

---

### 5. `src/features/settings/pages/account/index.tsx`

```tsx
'use client';

import React from 'react';
import { useGetAccountsQuery } from '@features/accounts/api/accounts.queries';
import { useGetUserSettingsQuery, useUpdateUserSettingsMutation } from '@features/settings/api/settings.queries';
import { ACCOUNT_SYNC_MODE } from '@mailsense/types';
import { useUserStore } from '@shared/store/useUserStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Label } from '@shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';
import { Switch } from '@shared/ui/switch';
import { Loader2, RefreshCw } from 'lucide-react';

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

export const AccountSyncSettings: React.FC = () => {
    const user = useUserStore((state) => state.user);
    const { data: userSettings, isLoading: isLoadingSettings } = useGetUserSettingsQuery(user?.id);
    const { data: accounts = [], isLoading: isLoadingAccounts } = useGetAccountsQuery(user?.id || '');
    const updateSettingsMutation = useUpdateUserSettingsMutation();

    if (isLoadingSettings || isLoadingAccounts) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const syncSettings = userSettings?.account?.syncSettings || {
        globalAutoSync: true,
        syncMode: ACCOUNT_SYNC_MODE.CUSTOM_PER_ACCOUNT,
        globalSyncInterval: 15,
        defaultSyncInterval: 15,
    };

    const handleGlobalAutoSyncToggle = (checked: boolean) => {
        updateSettingsMutation.mutate({
            account: {
                syncSettings: {
                    ...syncSettings,
                    globalAutoSync: checked,
                },
            },
        });
    };

    const handleSyncModeChange = (mode: ACCOUNT_SYNC_MODE) => {
        updateSettingsMutation.mutate({
            account: {
                syncSettings: {
                    ...syncSettings,
                    syncMode: mode,
                },
            },
        });
    };

    const handleGlobalIntervalChange = (val: string) => {
        const interval = parseInt(val, 10);
        updateSettingsMutation.mutate({
            account: {
                syncSettings: {
                    ...syncSettings,
                    globalSyncInterval: interval,
                },
            },
        });
    };

    return (
        <div className="space-y-6 pt-4">
            {/* Global Settings Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Global Background Sync Settings</CardTitle>
                    <CardDescription>Configure auto-synchronization behavior across all your connected email accounts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Master Switch */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Global Auto-Sync</Label>
                            <p className="text-sm text-muted-foreground">
                                Enable or disable automatic background fetching for all connected accounts.
                            </p>
                        </div>
                        <Switch checked={syncSettings.globalAutoSync} onCheckedChange={handleGlobalAutoSyncToggle} />
                    </div>

                    {/* Sync Mode */}
                    <div className="space-y-3 pt-2">
                        <Label className="text-base">Sync Mode</Label>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div
                                onClick={() => handleSyncModeChange(ACCOUNT_SYNC_MODE.CUSTOM_PER_ACCOUNT)}
                                className={`cursor-pointer rounded-lg border p-4 transition-all ${
                                    syncSettings.syncMode === ACCOUNT_SYNC_MODE.CUSTOM_PER_ACCOUNT
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-muted-foreground/30'
                                }`}
                            >
                                <div className="font-semibold">Custom Per Account</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Set individual sync intervals for each connected email mailbox.
                                </p>
                            </div>
                            <div
                                onClick={() => handleSyncModeChange(ACCOUNT_SYNC_MODE.SAME_FOR_ALL)}
                                className={`cursor-pointer rounded-lg border p-4 transition-all ${
                                    syncSettings.syncMode === ACCOUNT_SYNC_MODE.SAME_FOR_ALL
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-muted-foreground/30'
                                }`}
                            >
                                <div className="font-semibold">Same For All Accounts</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Enforce a single global sync interval across all mailboxes.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Global Interval Select (Enabled when SAME_FOR_ALL) */}
                    {syncSettings.syncMode === ACCOUNT_SYNC_MODE.SAME_FOR_ALL && (
                        <div className="flex items-center justify-between pt-2">
                            <div className="space-y-0.5">
                                <Label className="text-base">Global Sync Frequency</Label>
                                <p className="text-sm text-muted-foreground">Applied to all connected mailboxes.</p>
                            </div>
                            <Select
                                value={String(syncSettings.globalSyncInterval)}
                                onValueChange={handleGlobalIntervalChange}
                            >
                                <SelectTrigger className="w-56">
                                    <SelectValue placeholder="Select frequency" />
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
                    )}
                </CardContent>
            </Card>

            {/* Connected Accounts Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Connected Accounts Status</CardTitle>
                    <CardDescription>Overview of sync status and intervals for connected email mailboxes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="divide-y divide-border">
                        {accounts.map((acc) => (
                            <div key={acc._id} className="flex items-center justify-between py-3">
                                <div>
                                    <div className="font-medium text-sm">{acc.emailAddress}</div>
                                    <div className="text-xs text-muted-foreground capitalize">{acc.provider}</div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    {acc.syncInProgress && (
                                        <span className="inline-flex items-center text-xs text-blue-600 gap-1">
                                            <RefreshCw className="size-3 animate-spin" /> Syncing...
                                        </span>
                                    )}
                                    <div className="text-xs text-muted-foreground">
                                        Every {acc.syncInterval} mins
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AccountSyncSettings;
```

---

### 6. `src/features/settings/pages/index.tsx`

```tsx
'use client';

import React, { Suspense, useEffect } from 'react';

import { ROUTES, SETTINGS_OPTIONS } from '@shared/constants';
import { useBreadcrumbStore } from '@shared/store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import { Loader } from 'lucide-react';
import ProfileSettings from './profile';
import AccountSyncSettings from './account';

interface SettingsPageProps {
    setting: string;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ setting }) => {
    useEffect(() => {
        useBreadcrumbStore.setState({
            items: [{ title: 'Settings', url: ROUTES.SETTINGS }],
        });
    }, [setting]);

    return (
        <>
            <Tabs defaultValue={setting || 'profile'} className="-mt-8">
                <TabsList>
                    {SETTINGS_OPTIONS.map((option) => (
                        <TabsTrigger key={option.id} value={option.name} className="hover:cursor-pointer">
                            <option.icon className="size-5" />
                            <p className="text-sm">{option.title}</p>
                        </TabsTrigger>
                    ))}
                </TabsList>
                <TabsContent value="profile">
                    <ProfileSettings />
                </TabsContent>
                <TabsContent value="account">
                    <AccountSyncSettings />
                </TabsContent>
            </Tabs>
        </>
    );
};

const SettingsPageWrapper = ({ setting }: { setting: string }) => (
    <Suspense fallback={<Loader />}>
        <SettingsPage setting={setting} />
    </Suspense>
);

export default SettingsPageWrapper;
```

---

## Verification Plan

### Automated Verification
1. Run TypeScript build check in Frontend:
   ```bash
   pnpm type-check
   ```
2. Run ESLint checks in Frontend:
   ```bash
   pnpm lint
   ```

### Manual Verification
1. Navigate to `/settings/account` -> Verify tab navigation displays Profile and Account tabs cleanly.
2. Toggle Global Auto-Sync OFF -> Verify toast message displays and setting updates via API.
3. Switch Sync Mode to `SAME_FOR_ALL` and select 15 minutes -> Verify global sync interval dropdown updates and accounts sync frequency displays 15 mins.
