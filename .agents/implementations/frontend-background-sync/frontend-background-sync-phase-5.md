# Frontend Background Sync - Phase 5 Implementation Plan

This document details the step-by-step implementation for **Phase 5: Inbox Real-Time Refresh & Progress Banner** of the MailSense Frontend Background Sync system.

---

## Goal Description

Provide real-time email list updates and visual feedback in the Inbox view while background synchronization tasks are processing. This phase updates `useInboxPage` to detect active sync tasks (`syncInProgress === true`) across connected mailboxes, sets up an automated 10-second refetch interval during active background syncs, and renders a top progress banner under the inbox header informing users that new emails will load automatically.

---

## User Review Required

> [!IMPORTANT]
> **Real-Time Inbox Synchronization & Visual Banner**
> - **Automated Email Refetching**: While any mailbox has `syncInProgress === true`, `useInboxPage` polls `fetchEmailsData()` every 10 seconds (10,000 ms), seamlessly updating the email table without resetting user selections or page pagination.
> - **Visual Sync Banner**: Render a non-intrusive status banner (*"Background sync in progress... new emails will load automatically."*) with a spinning `RefreshCw` icon at the top of the Inbox table.

---

## Proposed Changes

### Component: Frontend Inbox Feature Layer (`src/features/inbox/`)

#### [MODIFY] [useInboxPage.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/inbox/hooks/useInboxPage.ts)
- Import `useGetAccountsQuery` from `@features/accounts/api/accounts.queries`.
- Compute `isSyncingInProgress` from `accountsData` (or single `accountData` if `accountId` is active).
- Add `useEffect` timer interval to invoke `fetchEmailsData()` every 10 seconds while `isSyncingInProgress === true`.
- Expose `isSyncingInProgress` in return parameters.

#### [MODIFY] [index.tsx (Inbox Page)](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/inbox/pages/index.tsx)
- Render top active background sync banner under `EmailListHeader` when `isSyncingInProgress === true`.

#### [MODIFY] [index.tsx (Account Inbox Page)](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/inbox/pages/account-inbox/index.tsx)
- Render top active background sync banner under `EmailListHeader` when `isSyncingInProgress === true`.

---

## File Contents

Below are the complete file modifications required for Phase 5 implementation.

### 1. `src/features/inbox/hooks/useInboxPage.ts`

```typescript
import { useCallback, useEffect, useState } from 'react';

import { useGetAccountDetailsQuery, useGetAccountsQuery } from '@features/accounts/api/accounts.queries';
import { EmailAttributes, Filter, FILTER_OPTION_TYPE, FilterOption, PaginatedDataResponse } from '@mailsense/types';
import { DATE_RANGE_DROPDOWN_OPTIONS, EMAILS_PAGE_SIZE, MESSAGES } from '@shared/constants';
import { UseDebounceQuery } from '@shared/hooks';
import { useAuthStore, useBreadcrumbStore } from '@shared/store';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useFetchEmailFilters, useFetchEmails } from '../api/inbox.queries';

interface useInboxPageReturnParams {
    emails: { data: PaginatedDataResponse<EmailAttributes> | null; fetchEmailsData: () => void; isLoadingEmails: boolean; isEmailError: boolean };
    emailFilterOptions: { data: FilterOption[] | undefined; isLoading: boolean };
    actions: {
        handleResetSelection: () => void;
        handleEmailSelect: (emailIds: string[]) => void;
        handlePageSizeChange: (newSize: number) => void;
        handleResetPage: () => void;
    };
    states: { selectedEmails: string[]; pageSize: number; searchValue: string; filter: Filter | null; page: number; isSyncingInProgress: boolean };
    setters: {
        setSearchValue: (value: string) => void;
        setFilter: (value: Filter) => void;
        setPage: (value: number) => void;
    };
}

export const useInboxPage = (accountId?: string): useInboxPageReturnParams => {
    const user = useAuthStore((state) => state.user);
    const searchParams = useSearchParams();
    const router = useRouter();

    const { data: emails, mutate: refetchEmails, isPending: isLoadingEmails, isError: isEmailError } = useFetchEmails();

    const { data: accountData, error: accountDetailsError } = useGetAccountDetailsQuery(accountId || '', { enabled: !!accountId });
    const { data: accountsData } = useGetAccountsQuery(user?.id || '', { enabled: !accountId && !!user?.id });

    const { data: emailFilters, isLoading: isLoadingEmailFilters } = useFetchEmailFilters();

    const [page, setPage] = useState(() => {
        const pageParam = searchParams.get('page');
        return pageParam ? parseInt(pageParam) : 1;
    });
    const [pageSize, setPageSize] = useState(EMAILS_PAGE_SIZE);
    const [searchValue, setSearchValue] = useState('');
    const [emailsData, setEmailsData] = useState<PaginatedDataResponse<EmailAttributes> | null>(null);
    const debouncedSearchValue = UseDebounceQuery({ text: searchValue, delay: 500 });
    const [errorShown, setErrorShown] = useState<boolean>(false);
    const [emailFilterOptions, setEmailFilterOptions] = useState<FilterOption[]>();
    const [filter, setFilter] = useState<Filter | null>(null);
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

    const isSyncingInProgress = accountId
        ? Boolean(accountData?.syncInProgress)
        : Boolean(Array.isArray(accountsData) && accountsData.some((acc) => acc.syncInProgress));

    const fetchEmailsData = useCallback(() => {
        if (!user) return;
        const currentPage = debouncedSearchValue !== undefined && debouncedSearchValue !== '' ? 1 : page;
        refetchEmails({
            userId: user.id,
            size: pageSize,
            page: currentPage,
            filters: {
                accountId: accountId ? [accountId] : filter?.accountId,
                searchText: debouncedSearchValue || undefined,
                folders: filter?.folders,
                dateRange: filter?.dateRange,
                unread: filter?.unread,
            },
        });
    }, [user, page, pageSize, debouncedSearchValue, refetchEmails, filter, accountId]);

    // Refetch emails automatically every 10 seconds while background sync runs
    useEffect(() => {
        if (!isSyncingInProgress) return;

        const intervalId = setInterval(() => {
            fetchEmailsData();
        }, 10000);

        return () => clearInterval(intervalId);
    }, [isSyncingInProgress, fetchEmailsData]);

    useEffect(() => {
        if (debouncedSearchValue !== undefined && debouncedSearchValue !== '') {
            setPage(1);
        }
    }, [debouncedSearchValue]);

    useEffect(() => {
        fetchEmailsData();
    }, [fetchEmailsData]);

    useEffect(() => {
        if (emails) {
            setEmailsData(emails);
        }
    }, [emails]);

    useEffect(() => {
        const urlPage = searchParams.get('page');
        if (urlPage !== page.toString()) {
            const params = new URLSearchParams(searchParams.toString());
            params.set('page', page.toString());
            const basePath = accountId ? `/inbox/${accountId}` : '/inbox';
            router.replace(`${basePath}?${params.toString()}`);
        }
    }, [page, accountId, router, searchParams]);

    useEffect(() => {
        if (accountId) {
            if (accountData) {
                useBreadcrumbStore.setState({
                    items: [
                        { title: 'Inbox', url: '/inbox' },
                        { title: accountData?.emailAddress || '', url: `/inbox/${accountData?._id}` },
                    ],
                });
            }
        } else {
            useBreadcrumbStore.setState({ items: [{ title: 'Inbox', url: '/inbox' }] });
        }
    }, [accountId, accountData]);

    useEffect(() => {
        if (emailFilters) {
            const filterOptionData: FilterOption[] = [
                ...(!accountId
                    ? [
                          {
                              id: 1,
                              name: 'accountId',
                              type: FILTER_OPTION_TYPE.DROPDOWN,
                              label: 'Accounts',
                              data:
                                  emailFilters?.accounts.map((account) => {
                                      return {
                                          id: account.id,
                                          name: account.id,
                                          label: account.emailAddress,
                                          provider: account.provider,
                                          selectedValue: '',
                                      };
                                  }) || [],
                          },
                      ]
                    : []),
                {
                    id: 2,
                    name: 'folders',
                    label: 'Folders',
                    type: FILTER_OPTION_TYPE.DROPDOWN,
                    data: emailFilters?.folders.map((folder) => {
                        return {
                            id: folder.id,
                            name: folder.providerFolderId,
                            label: folder.name,
                            selectedValue: '',
                        };
                    }),
                },
                {
                    id: 3,
                    name: 'dateRange',
                    label: 'Date Range',
                    type: FILTER_OPTION_TYPE.DROPDOWN,
                    data: DATE_RANGE_DROPDOWN_OPTIONS.map((item) => {
                        return {
                            id: item.name,
                            name: item.name,
                            label: item.label,
                            selectedValue: '',
                        };
                    }),
                },
                {
                    id: 4,
                    name: 'unread',
                    label: 'Unread',
                    type: FILTER_OPTION_TYPE.TOGGLE,
                    data: {
                        id: 'unread',
                        name: 'unread',
                        label: 'Unread',
                        selectedValue: false,
                    },
                },
            ];
            setEmailFilterOptions(filterOptionData);
        }
    }, [emailFilters, accountId]);

    const activeAccountError = accountId ? accountDetailsError : null;
    useEffect(() => {
        if (isEmailError && !errorShown) {
            toast.error(MESSAGES.EMAILS.EMAIL_LOAD_ERROR, { duration: 3000 });
            setErrorShown(true);
        } else if (activeAccountError && !errorShown) {
            toast.error(MESSAGES.ACCOUNTS.ACCOUNTS_LOAD_ERROR, { duration: 3000 });
            setErrorShown(true);
        } else if (!isEmailError && !activeAccountError) {
            setErrorShown(false);
        }
    }, [isEmailError, errorShown, activeAccountError]);

    const handlePageSizeChange = (newSize: number) => {
        setPage(1);
        setPageSize(newSize);
    };

    const handleEmailSelect = useCallback((emailIds: string[]) => {
        setSelectedEmails(emailIds);
    }, []);

    const handleResetSelection = useCallback(() => {
        setSelectedEmails([]);
    }, []);

    const handleResetPage = useCallback(() => {
        setPage(1);
    }, []);

    return {
        emails: { data: emailsData, fetchEmailsData, isLoadingEmails, isEmailError },
        emailFilterOptions: { data: emailFilterOptions, isLoading: isLoadingEmailFilters },
        actions: { handleResetSelection, handleEmailSelect, handlePageSizeChange, handleResetPage },
        states: { selectedEmails, pageSize, searchValue, filter, page, isSyncingInProgress },
        setters: { setSearchValue, setFilter, setPage },
    };
};
```

---

### 2. `src/features/inbox/pages/index.tsx`

```tsx
'use client';

import React, { Suspense } from 'react';
import { RefreshCw } from 'lucide-react';

import APILoader from '@shared/components/apiLoader';
import Loader from '@shared/components/loader';
import PaginationComponent from '@shared/components/table/Pagination';
import { useIsMobile } from '@shared/hooks';
import EmailListHeader from '../components/EmailListHeader';
import EmailListTable from '../components/EmailListTable';
import { useInboxPage } from '../hooks';

const InboxPage: React.FC = () => {
    const isMobile = useIsMobile();

    const {
        emails: { data: emailsData, fetchEmailsData, isLoadingEmails },
        emailFilterOptions: { data: emailFilterOptions, isLoading: isLoadingEmailFilters },
        actions: { handleEmailSelect, handlePageSizeChange, handleResetPage, handleResetSelection },
        states: { selectedEmails, page, pageSize, searchValue, filter, isSyncingInProgress },
        setters: { setPage, setSearchValue, setFilter },
    } = useInboxPage();

    return (
        <>
            <div className="flex items-center justify-center gap-4 px-4 py-2">
                <div className="flex h-full w-full flex-col items-center justify-center gap-4">
                    <APILoader show={isLoadingEmails || isLoadingEmailFilters} />
                    <EmailListHeader
                        searchValue={searchValue}
                        setSearchValue={setSearchValue}
                        filter={filter}
                        setFilter={setFilter}
                        selectedEmails={selectedEmails}
                        handleResetSelection={handleResetSelection}
                        handleResetPage={handleResetPage}
                        emailFilterOptions={emailFilterOptions || []}
                        fetchEmailsData={fetchEmailsData}
                    />

                    {/* Active Background Sync Banner */}
                    {isSyncingInProgress && (
                        <div className="flex w-full items-center justify-between rounded-lg bg-blue-500/10 px-4 py-2 text-xs font-medium text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-500/20">
                            <div className="flex items-center gap-2">
                                <RefreshCw className="size-3.5 animate-spin" />
                                <span>Background sync in progress... new emails will load automatically.</span>
                            </div>
                        </div>
                    )}

                    <div className={`flex w-full flex-col ${isMobile ? 'h-[calc(100vh-220px)]' : 'h-[calc(100vh-150px)]'}`}>
                        <EmailListTable
                            data={emailsData?.data || []}
                            page={page}
                            selectedEmails={selectedEmails}
                            onEmailSelect={handleEmailSelect}
                            onDeleteSuccess={fetchEmailsData}
                        />
                    </div>
                    <PaginationComponent
                        total={emailsData?.total || 0}
                        currentPage={page}
                        onPageChange={setPage}
                        onPageSizeChange={handlePageSizeChange}
                        pageSize={pageSize}
                    />
                </div>
            </div>
        </>
    );
};

const InboxPageWrapper = () => (
    <Suspense fallback={<Loader />}>
        <InboxPage />
    </Suspense>
);

export default InboxPageWrapper;
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
1. Trigger background sync -> Open `/inbox` page -> Verify active sync banner (*"Background sync in progress... new emails will load automatically."*) appears cleanly.
2. Wait 10 seconds during active sync -> Verify network tab shows `POST /emails/list` auto-fetching emails every 10 seconds until sync finishes.
3. Once sync completes -> Verify banner disappears automatically and polling stops.
