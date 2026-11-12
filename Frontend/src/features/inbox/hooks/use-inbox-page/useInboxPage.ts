'use client';

import { useRouter } from 'next/navigation';

import { useEmailActions } from '@features/emails/hooks/use-email-actions';
import { useEmailKeyboardShortcuts } from '@features/emails/hooks/use-email-keyboard-shortcuts';
import { UseInboxPageReturnParams } from '@features/emails/types/email-ui.types';
import { EmailAttributes } from '@mailsense/types';
import { useComposeEmailPopupStore } from '@shared/store';
import { useInboxPageData } from './useInboxPageData';
import { useInboxPageFilterOptions } from './useInboxPageFilters';

export const useInboxPage = (accountId?: string): UseInboxPageReturnParams => {
    const router = useRouter();

    const openCompose = useComposeEmailPopupStore((state) => state.openCompose);

    const {
        states: { listState, isSyncingInProgress },
        emails: { loading: isLoadingEmails, error: isEmailError },
        pagination: { data: pagination },
        actions: { fetchEmailsData },
    } = useInboxPageData(accountId);

    const {
        emailFilterOptions: { data: emailFilterOptions, loading: isLoadingEmailFilters },
    } = useInboxPageFilterOptions(accountId);

    const actions = useEmailActions({
        selectedEmails: listState.selectedEmails,
        emailsData: listState.emailsData,
        setEmailsData: listState.setEmailsData,
        onRefresh: fetchEmailsData,
        onClearSelection: listState.handleResetSelection,
    });

    useEmailKeyboardShortcuts({
        emails: listState.emailsData?.data || [],
        selectedIndex: listState.focusedIndex,
        selectedEmails: listState.selectedEmails,
        onSelectIndex: listState.setFocusedIndex,
        onOpenEmail: (email: EmailAttributes) => {
            router.push(`/inbox/${email.accountId}/email/${email._id}?page=${pagination.page}`);
        },
        onStarEmail: actions.starEmail,
        onMarkUnread: actions.unreadEmail,
        onArchiveEmail: actions.archiveEmail,
        onDeleteEmail: actions.deleteEmail.handlePromptDelete,
        onOpenCompose: openCompose,
        onOpenShortcutsModal: () => actions.setters.setIsShortcutsModalOpen(true),
        enabled: !isLoadingEmails && actions.states.emailsToDelete.length === 0 && !actions.states.isShortcutsModalOpen,
    });

    return {
        emails: { data: listState.emailsData, fetchEmailsData, isLoadingEmails, isEmailError },
        emailFilterOptions: { data: emailFilterOptions, isLoading: isLoadingEmailFilters },
        actions: {
            handleResetSelection: listState.handleResetSelection,
            handleEmailSelect: listState.handleEmailSelect,
            handlePageSizeChange: pagination.handlePageSizeChange,
            handleResetPage: pagination.handleResetPage,
            handleConfirmDelete: actions.deleteEmail.handleConfirmDelete,
            handleToggleStar: actions.starEmail,
            handleToggleUnread: actions.unreadEmail,
            handleArchiveEmail: actions.archiveEmail,
            handlePromptDelete: actions.deleteEmail.handlePromptDelete,
        },
        states: {
            selectedEmails: listState.selectedEmails,
            pageSize: pagination.pageSize,
            searchValue: pagination.searchValue,
            filter: pagination.filter,
            page: pagination.page,
            isSyncingInProgress,
            focusedIndex: listState.focusedIndex,
            isShortcutsModalOpen: actions.states.isShortcutsModalOpen,
            emailsToDelete: actions.states.emailsToDelete,
        },
        setters: {
            setSearchValue: pagination.setSearchValue,
            setFilter: pagination.setFilter,
            setPage: pagination.setPage,
            setFocusedIndex: listState.setFocusedIndex,
            setIsShortcutsModalOpen: actions.setters.setIsShortcutsModalOpen,
            setEmailsToDelete: actions.setters.setEmailsToDelete,
        },
    };
};
