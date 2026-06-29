import { useCallback, useEffect, useState } from 'react';

import { Email } from '@entities/email';
import { useGetAccountDetailsQuery } from '@features/accounts/api/accounts.queries';
import { DATE_RANGE_DROPDOWN_OPTIONS, EMAILS_PAGE_SIZE, MESSAGES } from '@shared/constants';
import { UseDebounceQuery } from '@shared/hooks';
import { useAuthStore, useBreadcrumbStore } from '@shared/store';
import { Filter, FilterOption, FilterOptionType, PaginatedDataResponse } from '@shared/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useFetchEmailFilters, useFetchEmails } from '../api/inbox.queries';

interface useInboxPageReturnParams {
    emails: { data: PaginatedDataResponse<Email> | null; fetchEmailsData: () => void; isLoadingEmails: boolean; isEmailError: boolean };
    emailFilterOptions: { data: FilterOption[] | undefined; isLoading: boolean };
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

    const { data: accountData, error: accountDetailsError } = useGetAccountDetailsQuery(accountId || '', { enabled: !!accountId });

    const { data: emailFilters, isLoading: isLoadingEmailFilters } = useFetchEmailFilters();

    const [page, setPage] = useState(() => {
        const pageParam = searchParams.get('page');
        return pageParam ? parseInt(pageParam) : 1;
    });
    const [pageSize, setPageSize] = useState(EMAILS_PAGE_SIZE);
    const [searchValue, setSearchValue] = useState('');
    const [emailsData, setEmailsData] = useState<PaginatedDataResponse<Email> | null>(null);
    const debouncedSearchValue = UseDebounceQuery({ text: searchValue, delay: 500 });
    const [errorShown, setErrorShown] = useState<boolean>(false);
    const [emailFilterOptions, setEmailFilterOptions] = useState<FilterOption[]>();
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
                folders: filter?.folders,
                dateRange: filter?.dateRange,
                unread: filter?.unread,
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

    useEffect(() => {
        if (emailFilters) {
            const filterOptionData: FilterOption[] = [
                ...(!accountId
                    ? [
                          {
                              id: 1,
                              name: 'accountId',
                              type: FilterOptionType.DROPDOWN,
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
                    type: FilterOptionType.DROPDOWN,
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
                    type: FilterOptionType.DROPDOWN,
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
                    type: FilterOptionType.TOGGLE,
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
        states: { selectedEmails, pageSize, searchValue, filter, page },
        setters: { setSearchValue, setFilter, setPage },
    };
};
