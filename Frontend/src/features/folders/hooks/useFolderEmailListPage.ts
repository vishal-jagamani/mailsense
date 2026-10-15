'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect } from 'react';

import { useGetAccountsQuery } from '@features/accounts/api/accounts.queries';
import { useEmailActions } from '@features/emails/hooks/useEmailActions';
import { useEmailKeyboardShortcuts } from '@features/emails/hooks/useEmailKeyboardShortcuts';
import { useEmailListState } from '@features/emails/hooks/useEmailListState';
import { useEmailPagination } from '@features/emails/hooks/useEmailPagination';
import { useFetchEmails } from '@features/inbox/api/inbox.queries';
import { EmailAttributes } from '@mailsense/types';
import { useAuthStore, useBreadcrumbStore, useComposeEmailPopupStore } from '@shared/store';
import { useGetFolderQuery } from '../api/folder.queries';

export const useFolderEmailListPage = (folderId: string) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuthStore();
    const openCompose = useComposeEmailPopupStore((state) => state.openCompose);

    const { data: folder } = useGetFolderQuery(folderId);
    const { data: emails, mutate: refetchEmails, isPending: isLoadingEmails } = useFetchEmails();
    const { data: accounts, isLoading: accountsLoading } = useGetAccountsQuery(user?.id ?? '');

    const pagination = useEmailPagination();
    const listState = useEmailListState();

    const fetchEmailsData = useCallback(() => {
        if (!user || !folder) return;
        const currentPage = pagination.debouncedSearchValue !== '' ? 1 : pagination.page;
        refetchEmails({
            userId: user.id,
            size: pagination.pageSize,
            page: currentPage,
            filters: {
                searchText: pagination.debouncedSearchValue || undefined,
                accountId: folder.accountId ? [folder.accountId] : undefined,
                dateRange: pagination.filter?.dateRange,
                folders: folder._id ? [folder._id] : undefined,
            },
        });
    }, [user, pagination.page, pagination.pageSize, pagination.debouncedSearchValue, pagination.filter, folder, refetchEmails]);

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
        if (pagination.debouncedSearchValue !== '') pagination.setPage(1);
    }, [pagination.debouncedSearchValue]);

    useEffect(() => {
        const urlPage = searchParams.get('page');
        if (urlPage !== pagination.page.toString()) {
            const params = new URLSearchParams(searchParams.toString());
            params.set('page', pagination.page.toString());
            router.replace(`/folders/${folderId}?${params.toString()}`);
        }
    }, [pagination.page, folderId, router, searchParams]);

    useEffect(() => {
        if (folder) {
            useBreadcrumbStore.setState({
                items: [
                    { title: 'Folders', url: '/folders' },
                    { title: folder.name, url: `/folders/${folderId}` },
                ],
            });
        }
    }, [folder, folderId]);

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

    return {
        emails: { data: listState.emailsData, fetch: fetchEmailsData, isLoading: isLoadingEmails },
        accounts: { data: accounts, isLoading: accountsLoading },
        states: {
            selectedEmails: listState.selectedEmails,
            page: pagination.page,
            pageSize: pagination.pageSize,
            searchValue: pagination.searchValue,
            filter: pagination.filter,
            focusedIndex: listState.focusedIndex,
            isShortcutsModalOpen: actions.isShortcutsModalOpen,
            emailsToDelete: actions.emailsToDelete,
        },
        setters: {
            setPage: pagination.setPage,
            setSearchValue: pagination.setSearchValue,
            setFilter: pagination.setFilter,
            setIsShortcutsModalOpen: actions.setIsShortcutsModalOpen,
            setEmailsToDelete: actions.setEmailsToDelete,
        },
        actions: {
            handlePageSizeChange: pagination.handlePageSizeChange,
            handleEmailSelect: listState.handleEmailSelect,
            handleResetSelection: listState.handleResetSelection,
            handleResetPage: pagination.handleResetPage,
            handleConfirmDelete: actions.handleConfirmDelete,
        },
    };
};
