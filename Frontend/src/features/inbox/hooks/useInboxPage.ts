'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { useGetAccountDetailsQuery, useGetAccountsQuery } from '@features/accounts/api/accounts.queries';
import { useEmailActions } from '@features/emails/hooks/useEmailActions';
import { useEmailKeyboardShortcuts } from '@features/emails/hooks/useEmailKeyboardShortcuts';
import { useEmailListState } from '@features/emails/hooks/useEmailListState';
import { useEmailPagination } from '@features/emails/hooks/useEmailPagination';
import { UseInboxPageReturnParams } from '@features/emails/types/email-ui.types';
import { EmailAttributes, FILTER_OPTION_TYPE, FilterOption } from '@mailsense/types';
import { DATE_RANGE_DROPDOWN_OPTIONS, MESSAGES } from '@shared/constants';
import { useAuthStore, useBreadcrumbStore, useComposeEmailPopupStore } from '@shared/store';
import { useFetchEmailFilters, useFetchEmails } from '../api/inbox.queries';

export const useInboxPage = (accountId?: string): UseInboxPageReturnParams => {
    const user = useAuthStore((state) => state.user);
    const router = useRouter();
    const searchParams = useSearchParams();
    const openCompose = useComposeEmailPopupStore((state) => state.openCompose);

    const { data: emails, mutate: refetchEmails, isPending: isLoadingEmails, isError: isEmailError } = useFetchEmails();
    const { data: accountData, error: accountDetailsError } = useGetAccountDetailsQuery(accountId || '', { enabled: !!accountId });
    const { data: accountsData } = useGetAccountsQuery(user?.id || '', { enabled: !accountId && !!user?.id });
    const { data: emailFilters, isLoading: isLoadingEmailFilters } = useFetchEmailFilters();

    const pagination = useEmailPagination();
    const listState = useEmailListState();
    const [errorShown, setErrorShown] = useState<boolean>(false);

    const isSyncingInProgress = accountId
        ? Boolean(accountData?.syncInProgress)
        : Boolean(Array.isArray(accountsData) && accountsData.some((acc) => acc.syncInProgress));

    const fetchEmailsData = useCallback(() => {
        if (!user) return;
        const currentPage = pagination.debouncedSearchValue !== '' ? 1 : pagination.page;
        refetchEmails({
            userId: user.id,
            size: pagination.pageSize,
            page: currentPage,
            filters: {
                accountId: accountId ? [accountId] : pagination.filter?.accountId,
                searchText: pagination.debouncedSearchValue || undefined,
                folders: pagination.filter?.folders,
                dateRange: pagination.filter?.dateRange,
                unread: pagination.filter?.unread,
            },
        });
    }, [user, pagination.page, pagination.pageSize, pagination.debouncedSearchValue, pagination.filter, accountId, refetchEmails]);

    const actions = useEmailActions({
        selectedEmails: listState.selectedEmails,
        emailsData: listState.emailsData,
        setEmailsData: listState.setEmailsData,
        onRefresh: fetchEmailsData,
        onClearSelection: listState.handleResetSelection,
    });

    useEffect(() => {
        if (emails) listState.setEmailsData(emails);
    }, [emails]);

    useEffect(() => {
        fetchEmailsData();
    }, [fetchEmailsData]);

    useEffect(() => {
        if (!isSyncingInProgress) return;
        const intervalId = setInterval(fetchEmailsData, 10000);
        return () => clearInterval(intervalId);
    }, [isSyncingInProgress, fetchEmailsData]);

    useEffect(() => {
        if (pagination.debouncedSearchValue !== '') pagination.setPage(1);
    }, [pagination.debouncedSearchValue]);

    useEffect(() => {
        const urlPage = searchParams.get('page');
        if (urlPage !== pagination.page.toString()) {
            const params = new URLSearchParams(searchParams.toString());
            params.set('page', pagination.page.toString());
            const basePath = accountId ? `/inbox/${accountId}` : '/inbox';
            router.replace(`${basePath}?${params.toString()}`);
        }
    }, [pagination.page, accountId, router, searchParams]);

    useEffect(() => {
        if (accountId && accountData) {
            useBreadcrumbStore.setState({
                items: [
                    { title: 'Inbox', url: '/inbox' },
                    { title: accountData.emailAddress || '', url: `/inbox/${accountData._id}` },
                ],
            });
        } else if (!accountId) {
            useBreadcrumbStore.setState({ items: [{ title: 'Inbox', url: '/inbox' }] });
        }
    }, [accountId, accountData]);

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

    useEmailKeyboardShortcuts({
        emails: listState.emailsData?.data || [],
        selectedIndex: listState.focusedIndex,
        selectedEmails: listState.selectedEmails,
        onSelectIndex: listState.setFocusedIndex,
        onOpenEmail: (email: EmailAttributes) => {
            router.push(`/inbox/${email.accountId}/email/${email._id}?page=${pagination.page}`);
        },
        onStarEmail: actions.handleToggleStar,
        onMarkUnread: actions.handleToggleUnread,
        onArchiveEmail: actions.handleArchiveEmail,
        onDeleteEmail: actions.handlePromptDelete,
        onOpenCompose: openCompose,
        onOpenShortcutsModal: () => actions.setIsShortcutsModalOpen(true),
        enabled: !isLoadingEmails && actions.emailsToDelete.length === 0 && !actions.isShortcutsModalOpen,
    });

    const emailFilterOptions: FilterOption[] | undefined = useMemo(() => {
        if (!emailFilters) return undefined;
        return [
            ...(!accountId
                ? [
                      {
                          id: 1,
                          name: 'accountId',
                          type: FILTER_OPTION_TYPE.DROPDOWN,
                          label: 'Accounts',
                          data:
                              emailFilters.accounts?.map((acc) => ({
                                  id: acc.id,
                                  name: acc.id,
                                  label: acc.emailAddress,
                                  provider: acc.provider,
                                  selectedValue: '',
                              })) || [],
                      },
                  ]
                : []),
            {
                id: 2,
                name: 'folders',
                label: 'Folders',
                type: FILTER_OPTION_TYPE.DROPDOWN,
                data:
                    emailFilters.folders?.map((folder) => ({
                        id: folder.id,
                        name: folder.id,
                        label: folder.name,
                        selectedValue: '',
                    })) || [],
            },
            {
                id: 3,
                name: 'dateRange',
                label: 'Date Range',
                type: FILTER_OPTION_TYPE.DROPDOWN,
                data: DATE_RANGE_DROPDOWN_OPTIONS.map((item) => ({
                    id: item.name,
                    name: item.name,
                    label: item.label,
                    selectedValue: '',
                })),
            },
            {
                id: 4,
                name: 'unread',
                label: 'Unread',
                type: FILTER_OPTION_TYPE.TOGGLE,
                data: { id: 'unread', name: 'unread', label: 'Unread', selectedValue: false },
            },
        ];
    }, [emailFilters, accountId]);

    return {
        emails: { data: listState.emailsData, fetchEmailsData, isLoadingEmails, isEmailError },
        emailFilterOptions: { data: emailFilterOptions, isLoading: isLoadingEmailFilters },
        actions: {
            handleResetSelection: listState.handleResetSelection,
            handleEmailSelect: listState.handleEmailSelect,
            handlePageSizeChange: pagination.handlePageSizeChange,
            handleResetPage: pagination.handleResetPage,
            handleConfirmDelete: actions.handleConfirmDelete,
            handleToggleStar: actions.handleToggleStar,
            handleToggleUnread: actions.handleToggleUnread,
            handleArchiveEmail: actions.handleArchiveEmail,
            handlePromptDelete: actions.handlePromptDelete,
        },
        states: {
            selectedEmails: listState.selectedEmails,
            pageSize: pagination.pageSize,
            searchValue: pagination.searchValue,
            filter: pagination.filter,
            page: pagination.page,
            isSyncingInProgress,
            focusedIndex: listState.focusedIndex,
            isShortcutsModalOpen: actions.isShortcutsModalOpen,
            emailsToDelete: actions.emailsToDelete,
        },
        setters: {
            setSearchValue: pagination.setSearchValue,
            setFilter: pagination.setFilter,
            setPage: pagination.setPage,
            setFocusedIndex: listState.setFocusedIndex,
            setIsShortcutsModalOpen: actions.setIsShortcutsModalOpen,
            setEmailsToDelete: actions.setEmailsToDelete,
        },
    };
};
