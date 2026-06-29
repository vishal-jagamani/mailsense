import { useCallback, useEffect, useState } from 'react';

import { AccountAttributes } from '@entities/account';
import { Email } from '@entities/email';
import { useGetAccountDetailsQuery, useGetAccountsQuery } from '@features/accounts/api/accounts.queries';
import { EMAILS_PAGE_SIZE, MESSAGES } from '@shared/constants';
import { UseDebounceQuery } from '@shared/hooks';
import { useAuthStore, useBreadcrumbStore } from '@shared/store';
import { Filter, PaginatedDataResponse } from '@shared/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useFetchEmails } from '../api/inbox.queries';

interface useInboxPageReturnParams {
    accounts: { data: AccountAttributes[] | undefined; accountsDataLoading: boolean; accountDataError: Error | null };
    emails: { data: PaginatedDataResponse<Email> | null; fetchEmailsData: () => void; isLoadingEmails: boolean; isEmailError: boolean };
    actions: {
        handleResetSelection: () => void;
        handleEmailSelect: (emailIds: string[]) => void;
        handlePageSizeChange: (newSize: number) => void;
        handleResetPage: () => void;
    };
    states: { selectedEmails: string[]; pageSize: number; searchValue: string; filter: Filter | null; page: number };
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

    const {
        data: accountsData,
        isLoading: allAccountsLoading,
        error: accountsError,
    } = useGetAccountsQuery(user?.id ?? '', { enabled: !accountId && !!user?.id });

    const {
        data: accountData,
        isLoading: accountLoading,
        error: accountDetailsError,
    } = useGetAccountDetailsQuery(accountId || '', { enabled: !!accountId });

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
                dateRange: filter?.dateRange,
            },
        });
    }, [user, page, pageSize, debouncedSearchValue, refetchEmails, filter, accountId]);

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

    const activeAccountError = accountId ? accountDetailsError : accountsError;
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
        accounts: {
            data: accountsData,
            accountsDataLoading: accountId ? accountLoading : allAccountsLoading,
            accountDataError: activeAccountError as Error | null,
        },
        emails: { data: emailsData, fetchEmailsData, isLoadingEmails, isEmailError },
        actions: { handleResetSelection, handleEmailSelect, handlePageSizeChange, handleResetPage },
        states: { selectedEmails, pageSize, searchValue, filter, page },
        setters: { setSearchValue, setFilter, setPage },
    };
};
