import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useGetAccountsQuery } from '@features/accounts/api/accounts.queries';
import { useFetchEmails } from '@features/inbox/api/inbox.queries';
import { EMAILS_PAGE_SIZE, MESSAGES } from '@shared/constants';
import { UseDebounceQuery } from '@shared/hooks';
import { useAuthStore, useBreadcrumbStore } from '@shared/store';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGetFolderQuery } from '../api/folder.queries';
import { Filter, PaginatedDataResponse } from '@shared/types';
import { Email } from '@entities/email';

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
    const [emailsData, setEmailsData] = useState<PaginatedDataResponse<Email> | null>(null);
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
                folders: folder?.providerFolderId ? [folder.providerFolderId] : undefined,
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
            toast.error(MESSAGES.EMAIL_LOAD_ERROR, { duration: 3000 });
            setErrorShown(true);
        } else if (accountError && !errorShown) {
            toast.error(MESSAGES.ACCOUNTS_LOAD_ERROR, { duration: 3000 });
            setErrorShown(true);
        } else if (isFolderError && !errorShown) {
            toast.error(MESSAGES.FOLDERS.FOLDER_LOAD_ERROR, { duration: 3000 });
            setErrorShown(true);
        } else if (!isEmailError && !accountError && !isFolderError) {
            setErrorShown(false);
        }
    }, [isEmailError, errorShown, accountError, isFolderError]);

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
        states: { page, pageSize, searchValue, filter, selectedEmails },
        setters: { setPage, setSearchValue, setFilter },
        actions: { handlePageSizeChange, handleEmailSelect, handleResetSelection, handleResetPage },
    };
};
