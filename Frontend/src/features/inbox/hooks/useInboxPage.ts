import { useCallback, useEffect, useState } from 'react';

import { GetAllEmailsFilters, GetEmailsResponse } from '@entities/email';
import { useGetAccountsQuery, useGetAccountDetailsQuery } from '@features/accounts/api/accounts.queries';
import { EMAILS_PAGE_SIZE, MESSAGES } from '@shared/constants';
import { UseDebounceQuery } from '@shared/hooks';
import { useAuthStore, useBreadcrumbStore } from '@shared/store';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useFetchEmails } from '../api/inbox.queries';
import { AccountAttributes } from '@entities/account';

interface useInboxPageReturnParams {
    accounts: { data: AccountAttributes[] | undefined; accountsDataLoading: boolean; accountDataError: Error | null };
    emails: { data: GetEmailsResponse | null; fetchEmailsData: () => void; isLoadingEmails: boolean; isEmailError: boolean };
    actions: {
        handleResetSelection: () => void;
        handleEmailSelect: (emailIds: string[]) => void;
        handlePageSizeChange: (newSize: number) => void;
        handleResetPage: () => void;
    };
    states: { selectedEmails: string[]; pageSize: number; searchValue: string; getAllEmailsFilters: GetAllEmailsFilters | null; page: number };
    setters: {
        setSearchValue: (value: string) => void;
        setGetAllEmailsFilters: (value: GetAllEmailsFilters) => void;
        setPage: (value: number) => void;
    };
}

export const useInboxPage = (accountId?: string): useInboxPageReturnParams => {
    const user = useAuthStore((state) => state.user);
    const searchParams = useSearchParams();
    const router = useRouter();

    const { data: emails, mutate: refetchEmails, isPending: isLoadingEmails, isError: isEmailError } = useFetchEmails();
    
    const { data: accountsData, isLoading: allAccountsLoading, error: accountsError } = useGetAccountsQuery(
        user?.id ?? '',
        { enabled: !accountId && !!user?.id } as any
    );

    const { data: accountData, isLoading: accountLoading, error: accountDetailsError } = useGetAccountDetailsQuery(
        accountId || '',
        { enabled: !!accountId } as any
    );

    const [page, setPage] = useState(() => {
        const pageParam = searchParams.get('page');
        return pageParam ? parseInt(pageParam) : 1;
    });
    const [pageSize, setPageSize] = useState(EMAILS_PAGE_SIZE);
    const [searchValue, setSearchValue] = useState('');
    const [emailsData, setEmailsData] = useState<GetEmailsResponse | null>(null);
    const debouncedSearchValue = UseDebounceQuery({ text: searchValue, delay: 500 });
    const [errorShown, setErrorShown] = useState<boolean>(false);
    const [getAllEmailsFilters, setGetAllEmailsFilters] = useState<GetAllEmailsFilters | null>(null);
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

    const fetchEmailsData = useCallback(() => {
        if (!user) return;
        const currentPage = debouncedSearchValue !== undefined && debouncedSearchValue !== '' ? 1 : page;
        refetchEmails({
            userId: user.id,
            size: pageSize,
            page: currentPage,
            filters: {
                accountId: accountId ? [accountId] : getAllEmailsFilters?.accountId,
                searchText: debouncedSearchValue || undefined,
                dateRange: getAllEmailsFilters?.dateRange,
            },
        });
    }, [user, page, pageSize, debouncedSearchValue, refetchEmails, getAllEmailsFilters, accountId]);

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
            toast.error(MESSAGES.EMAIL_LOAD_ERROR, { duration: 3000 });
            setErrorShown(true);
        } else if (activeAccountError && !errorShown) {
            toast.error(MESSAGES.ACCOUNTS_LOAD_ERROR, { duration: 3000 });
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
        states: { selectedEmails, pageSize, searchValue, getAllEmailsFilters, page },
        setters: { setSearchValue, setGetAllEmailsFilters, setPage },
    };
};

