import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useGetAccountsQuery } from '@features/accounts/api/accounts.queries';
import { useArchiveEmailMutation, useStarEmailMutation, useUnreadEmailMutation } from '@features/emails/api/email.mutations';
import { useEmailKeyboardShortcuts } from '@features/emails/hooks/useEmailKeyboardShortcuts';
import { useDeleteEmail, useFetchEmails } from '@features/inbox/api/inbox.queries';
import { EmailAttributes, Filter, PaginatedDataResponse } from '@mailsense/types';
import { EMAILS_PAGE_SIZE, MESSAGES } from '@shared/constants';
import { UseDebounceQuery } from '@shared/hooks';
import { useAuthStore, useBreadcrumbStore, useComposeEmailPopupStore } from '@shared/store';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGetFolderQuery } from '../api/folder.queries';

export const useFolderEmailListPage = (folderId: string) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuthStore();

    const [page, setPage] = useState(() => {
        const pageParam = searchParams.get('page');
        return pageParam ? parseInt(pageParam) : 1;
    });
    const [pageSize, setPageSize] = useState(EMAILS_PAGE_SIZE);
    const [searchValue, setSearchValue] = useState('');
    const [emailsData, setEmailsData] = useState<PaginatedDataResponse<EmailAttributes> | null>(null);
    const debouncedSearchValue = UseDebounceQuery({ text: searchValue, delay: 500 });
    const [errorShown, setErrorShown] = useState<boolean>(false);
    const [filter, setFilter] = useState<Filter | null>(null);
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

    const { data: folder, isError: isFolderError } = useGetFolderQuery(folderId);
    const { data: emails, mutate: refetchEmails, isPending: isLoadingEmails, isError: isEmailError } = useFetchEmails();
    const { data: accounts, isLoading: accountsLoading, error: accountError } = useGetAccountsQuery(user?.id ?? '');

    const fetchEmailsData = useCallback(() => {
        if (!user || !folder) return;
        const currentPage = debouncedSearchValue !== undefined && debouncedSearchValue !== '' ? 1 : page;
        refetchEmails({
            userId: user.id,
            size: pageSize,
            page: currentPage,
            filters: {
                searchText: debouncedSearchValue || undefined,
                accountId: folder?.accountId ? [folder.accountId] : undefined,
                dateRange: filter?.dateRange,
                folders: folder?._id ? [folder._id] : undefined,
            },
        });
    }, [user, page, pageSize, debouncedSearchValue, refetchEmails, filter, folder]);

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
            setSelectedEmails([]); // Reset selection when email list changes
        }
    }, [emails]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        params.set('page', page.toString());
        router.replace(`/folders/${folderId}?${params.toString()}`, { scroll: false });
    }, [page, folderId, router]);

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

    useEffect(() => {
        if (isEmailError && !errorShown) {
            toast.error(MESSAGES.EMAILS.EMAIL_LOAD_ERROR, { duration: 3000 });
            setErrorShown(true);
        } else if (accountError && !errorShown) {
            toast.error(MESSAGES.ACCOUNTS.ACCOUNTS_LOAD_ERROR, { duration: 3000 });
            setErrorShown(true);
        } else if (isFolderError && !errorShown) {
            toast.error(MESSAGES.FOLDERS.FOLDER_LOAD_ERROR, { duration: 3000 });
            setErrorShown(true);
        } else if (!isEmailError && !accountError && !isFolderError) {
            setErrorShown(false);
        }
    }, [isEmailError, errorShown, accountError, isFolderError]);

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
            try {
                if (selectedEmails.length > 0) {
                    setEmailsToDelete(selectedEmails);
                } else if (email) {
                    setEmailsToDelete([email._id]);
                }
            } catch (error) {
                console.error('Error handling delete shortcut:', error);
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
        emails: { data: emailsData, fetch: fetchEmailsData, isLoading: isLoadingEmails },
        accounts: { data: accounts, isLoading: accountsLoading, error: accountError },
        states: {
            page,
            pageSize,
            searchValue,
            filter,
            selectedEmails,
            focusedIndex,
            isShortcutsModalOpen,
            emailsToDelete,
        },
        setters: {
            setPage,
            setSearchValue,
            setFilter,
            setFocusedIndex,
            setIsShortcutsModalOpen,
            setEmailsToDelete,
        },
        actions: { handlePageSizeChange, handleEmailSelect, handleResetSelection, handleResetPage, handleConfirmDelete },
    };
};
