import { useCallback, useEffect, useState } from 'react';

import { useGetAccountDetailsQuery, useGetAccountsQuery } from '@features/accounts/api/accounts.queries';
import { useArchiveEmailMutation, useStarEmailMutation, useUnreadEmailMutation } from '@features/emails/api/email.mutations';
import { useEmailKeyboardShortcuts } from '@features/emails/hooks/useEmailKeyboardShortcuts';
import { EmailAttributes, Filter, FILTER_OPTION_TYPE, FilterOption, PaginatedDataResponse } from '@mailsense/types';
import { DATE_RANGE_DROPDOWN_OPTIONS, EMAILS_PAGE_SIZE, MESSAGES } from '@shared/constants';
import { UseDebounceQuery } from '@shared/hooks';
import { useAuthStore, useBreadcrumbStore, useComposeEmailPopupStore } from '@shared/store';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useDeleteEmail, useFetchEmailFilters, useFetchEmails } from '../api/inbox.queries';

interface useInboxPageReturnParams {
    emails: { data: PaginatedDataResponse<EmailAttributes> | null; fetchEmailsData: () => void; isLoadingEmails: boolean; isEmailError: boolean };
    emailFilterOptions: { data: FilterOption[] | undefined; isLoading: boolean };
    actions: {
        handleResetSelection: () => void;
        handleEmailSelect: (emailIds: string[]) => void;
        handlePageSizeChange: (newSize: number) => void;
        handleResetPage: () => void;
        handleConfirmDelete: () => void;
    };
    states: {
        selectedEmails: string[];
        pageSize: number;
        searchValue: string;
        filter: Filter | null;
        page: number;
        isSyncingInProgress: boolean;
        focusedIndex: number;
        isShortcutsModalOpen: boolean;
        emailsToDelete: string[];
    };
    setters: {
        setSearchValue: (value: string) => void;
        setFilter: (value: Filter) => void;
        setPage: (value: number) => void;
        setFocusedIndex: (index: number) => void;
        setIsShortcutsModalOpen: (open: boolean) => void;
        setEmailsToDelete: (emails: string[]) => void;
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
                            name: folder.id,
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

    const [focusedIndex, setFocusedIndex] = useState<number>(-1);
    const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);
    const [emailsToDelete, setEmailsToDelete] = useState<string[]>([]);

    const { mutate: starEmailMutate } = useStarEmailMutation();
    const { mutate: unreadEmailMutate } = useUnreadEmailMutation();
    const { mutate: archiveEmailMutate } = useArchiveEmailMutation();
    const { mutate: deleteEmailMutate } = useDeleteEmail();
    const openCompose = useComposeEmailPopupStore((state) => state.openCompose);

    const handleToggleStar = (email?: EmailAttributes): void => {
        const targetIds: string[] = selectedEmails.length > 0 ? [...selectedEmails] : email ? [email._id] : [];
        if (targetIds.length === 0) return;

        let nextStar = true;
        if (emailsData?.data) {
            const targetEmails = emailsData.data.filter((item) => targetIds.includes(item._id));
            const allStarred =
                targetEmails.length > 0 &&
                targetEmails.every((item) => item.folders?.some((f) => f.toUpperCase() === 'STARRED' || f.toLowerCase() === 'starred'));
            nextStar = !allStarred;
        } else if (email) {
            const isStarred = Boolean(email.folders?.some((f: string) => f.toUpperCase() === 'STARRED' || f.toLowerCase() === 'starred'));
            nextStar = !isStarred;
        }

        const previousData = emailsData;
        setEmailsData((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                data: prev.data.map((item) => {
                    if (targetIds.includes(item._id)) {
                        const currentFolders = item.folders || [];
                        const updatedFolders = nextStar
                            ? Array.from(new Set([...currentFolders, 'STARRED']))
                            : currentFolders.filter((f) => f.toUpperCase() !== 'STARRED' && f.toLowerCase() !== 'starred');
                        return { ...item, folders: updatedFolders };
                    }
                    return item;
                }),
            };
        });

        starEmailMutate(
            { emailIds: targetIds, star: nextStar },
            {
                onSuccess: (res) => {
                    if (res && (!('status' in res) || res.status)) {
                        const label =
                            targetIds.length > 1
                                ? nextStar
                                    ? `${targetIds.length} emails starred`
                                    : `${targetIds.length} emails unstarred`
                                : nextStar
                                  ? 'Email starred'
                                  : 'Email unstarred';
                        toast.success(label, { duration: 3000 });
                        fetchEmailsData();
                    } else {
                        toast.error('Failed to update star status. Please retry in some time.', { duration: 4000 });
                        setEmailsData(previousData);
                        fetchEmailsData();
                    }
                },
                onError: (error: Error) => {
                    console.error('Error toggling star status:', error);
                    setEmailsData(previousData);
                    fetchEmailsData();
                },
            },
        );
    };

    const handleToggleUnread = (email?: EmailAttributes): void => {
        const targetIds: string[] = selectedEmails.length > 0 ? [...selectedEmails] : email ? [email._id] : [];
        if (targetIds.length === 0) return;

        let nextUnread = true;
        if (emailsData?.data) {
            const targetEmails = emailsData.data.filter((item) => targetIds.includes(item._id));
            const allUnread = targetEmails.length > 0 && targetEmails.every((item) => !item.isRead);
            nextUnread = !allUnread;
        } else if (email) {
            nextUnread = email.isRead;
        }

        const previousData = emailsData;
        setEmailsData((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                data: prev.data.map((item) => {
                    if (targetIds.includes(item._id)) {
                        return { ...item, isRead: !nextUnread };
                    }
                    return item;
                }),
            };
        });

        unreadEmailMutate(
            { emailIds: targetIds, unread: nextUnread },
            {
                onSuccess: (res) => {
                    if (res && res.status) {
                        const label =
                            targetIds.length > 1
                                ? nextUnread
                                    ? `${targetIds.length} emails marked as unread`
                                    : `${targetIds.length} emails marked as read`
                                : nextUnread
                                  ? 'Marked as unread'
                                  : 'Marked as read';
                        toast.success(label, { duration: 3000 });
                        fetchEmailsData();
                    } else {
                        toast.error('Failed to update read status. Please retry in some time.', { duration: 4000 });
                        setEmailsData(previousData);
                        fetchEmailsData();
                    }
                },
                onError: (error: Error) => {
                    console.error('Error toggling read status:', error);
                    setEmailsData(previousData);
                    fetchEmailsData();
                },
            },
        );
    };

    const handleArchiveEmail = (email?: EmailAttributes): void => {
        const targetIds: string[] = selectedEmails.length > 0 ? [...selectedEmails] : email ? [email._id] : [];
        if (targetIds.length === 0) return;

        const previousData = emailsData;
        const previousSelected = selectedEmails;

        setEmailsData((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                data: prev.data.filter((item) => !targetIds.includes(item._id)),
                total: Math.max(0, prev.total - targetIds.length),
            };
        });

        setSelectedEmails((prev) => prev.filter((id) => !targetIds.includes(id)));

        archiveEmailMutate(
            { emailIds: targetIds, archive: true },
            {
                onSuccess: (res) => {
                    if (res && res.status) {
                        const label =
                            targetIds.length > 1 ? `${targetIds.length} emails archived successfully` : 'Email archived successfully';
                        toast.success(label, { duration: 3000 });
                        fetchEmailsData();
                    } else {
                        toast.error(
                            targetIds.length > 1
                                ? 'Failed to archive emails. Please retry in some time.'
                                : 'Failed to archive email. Please retry in some time.',
                            { duration: 4000 },
                        );
                        setEmailsData(previousData);
                        setSelectedEmails(previousSelected);
                        fetchEmailsData();
                    }
                },
                onError: (error: Error) => {
                    console.error('Error archiving email:', error);
                    setEmailsData(previousData);
                    setSelectedEmails(previousSelected);
                    fetchEmailsData();
                },
            },
        );
    };

    const handleConfirmDelete = (): void => {
        if (emailsToDelete.length === 0) return;
        const targetIds = [...emailsToDelete];
        setEmailsToDelete([]);

        const previousData = emailsData;
        const previousSelected = selectedEmails;

        setEmailsData((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                data: prev.data.filter((item) => !targetIds.includes(item._id)),
                total: Math.max(0, prev.total - targetIds.length),
            };
        });

        setSelectedEmails((prev) => prev.filter((id) => !targetIds.includes(id)));

        deleteEmailMutate(
            { emailIds: targetIds, trash: true },
            {
                onSuccess: (res) => {
                    if (res && res.status) {
                        toast.success(
                            targetIds.length > 1 ? `${targetIds.length} emails deleted successfully` : 'Email deleted successfully',
                            { duration: 3000 },
                        );
                        fetchEmailsData();
                    } else {
                        toast.error(
                            targetIds.length > 1
                                ? 'Failed to delete emails. Please retry in some time.'
                                : 'Failed to delete email. Please retry in some time.',
                            { duration: 4000 },
                        );
                        setEmailsData(previousData);
                        setSelectedEmails(previousSelected);
                        fetchEmailsData();
                    }
                },
                onError: (error: Error) => {
                    console.error('Error deleting emails:', error);
                    setEmailsData(previousData);
                    setSelectedEmails(previousSelected);
                    fetchEmailsData();
                },
            },
        );
    };

    useEffect(() => {
        setFocusedIndex(-1);
    }, [page, debouncedSearchValue, filter]);

    useEffect(() => {
        if (emailsData?.data && focusedIndex >= emailsData.data.length) {
            setFocusedIndex(Math.max(-1, emailsData.data.length - 1));
        }
    }, [emailsData, focusedIndex]);

    useEmailKeyboardShortcuts({
        emails: emailsData?.data || [],
        selectedIndex: focusedIndex,
        selectedEmails,
        onSelectIndex: setFocusedIndex,
        onOpenEmail: (email: EmailAttributes) => {
            router.push(`/inbox/${email.accountId}/email/${email._id}?page=${page}`);
        },
        onStarEmail: handleToggleStar,
        onMarkUnread: handleToggleUnread,
        onArchiveEmail: handleArchiveEmail,
        onDeleteEmail: (email?: EmailAttributes) => {
                if (selectedEmails.length > 0) {
                    setEmailsToDelete(selectedEmails);
                } else if (email) {
                    setEmailsToDelete([email._id]);
                }
        },
        onOpenCompose: openCompose,
        onOpenShortcutsModal: () => setIsShortcutsModalOpen(true),
        enabled: !isLoadingEmails && emailsToDelete.length === 0 && !isShortcutsModalOpen,
    });

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
        actions: { handleResetSelection, handleEmailSelect, handlePageSizeChange, handleResetPage, handleConfirmDelete },
        states: {
            selectedEmails,
            pageSize,
            searchValue,
            filter,
            page,
            isSyncingInProgress,
            focusedIndex,
            isShortcutsModalOpen,
            emailsToDelete,
        },
        setters: {
            setSearchValue,
            setFilter,
            setPage,
            setFocusedIndex,
            setIsShortcutsModalOpen,
            setEmailsToDelete,
        },
    };
};
