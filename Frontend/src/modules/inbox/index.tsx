'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import APILoader from '@/shared/components/apiLoader';
import SearchHeader from '@/shared/components/inputs/SearchHeader';
import Loader from '@/shared/components/loader';
import PaginationComponent from '@/shared/components/table/Pagination';
import { EMAILS_PAGE_SIZE, MESSAGES } from '@/shared/constants';
import { UI_CONSTANTS } from '@/shared/constants/ui';
import { UseDebounceQuery } from '@/shared/hooks/useDebounceQuery';
import { useBreadcrumbStore } from '@/shared/store/breadcrumb.store';
import { GetEmailsResponse } from '@/shared/types/email.types';
import { GetAllEmailsFilters } from '@/shared/types/inbox.types';
import { useAuthStore } from '@/store';
import { useGetAccountsQuery } from '../accounts/services/useAccountApi';
import EmailListTable from '../home/components/EmailListTable';
import { useFetchEmails } from '../home/services/useHomeApi';
import EmailListFilter from './components/EmailListFilter';
import EmailMenuBarOptions from './components/EmailMenuBarOptions';

const InboxPageWrapper = () => (
    <Suspense fallback={<Loader />}>
        <InboxPage />
    </Suspense>
);

export default InboxPageWrapper;

const InboxPage: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuthStore();

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

    const { data: emails, mutate: refetchEmails, isPending: isLoadingEmails, isError: isEmailError } = useFetchEmails();
    const { data: accounts, isLoading: accountsLoading, error: accountError } = useGetAccountsQuery(user?.id ?? '');

    const fetchEmailsData = useCallback(() => {
        if (!user) return;
        const currentPage = debouncedSearchValue !== undefined && debouncedSearchValue !== '' ? 1 : page;
        refetchEmails({
            userId: user.id,
            size: pageSize,
            page: currentPage,
            filters: {
                searchText: debouncedSearchValue || undefined,
                accountId: getAllEmailsFilters?.accountId,
                dateRange: getAllEmailsFilters?.dateRange,
            },
        });
    }, [user, page, pageSize, debouncedSearchValue, refetchEmails, getAllEmailsFilters]);

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
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', page.toString());
        router.replace(`/inbox?${params.toString()}`);
    }, [page]);

    useEffect(() => {
        useBreadcrumbStore.setState({ items: [{ title: 'Inbox', url: '/inbox' }] });
    }, []);

    useEffect(() => {
        if (isEmailError && !errorShown) {
            toast.error(MESSAGES.EMAIL_LOAD_ERROR, { duration: 3000 });
            setErrorShown(true);
        } else if (accountError && !errorShown) {
            toast.error(MESSAGES.ACCOUNTS_LOAD_ERROR, { duration: 3000 });
            setErrorShown(true);
        } else if (!isEmailError && !accountError) {
            setErrorShown(false);
        }
    }, [isEmailError, errorShown, accountError]);

    const handlePageSizeChange = (newSize: number) => {
        setPage(1);
        setPageSize(newSize);
    };

    const handleEmailSelect = (emailIds: string[]) => {
        setSelectedEmails(emailIds);
    };

    return (
        <>
            <div className="flex items-center justify-center gap-4 px-4 py-2">
                <div className="flex h-full w-full flex-col items-center justify-center gap-4">
                    <APILoader show={isLoadingEmails || accountsLoading} />
                    <div className="flex w-full items-center gap-2">
                        <EmailListFilter
                            accounts={accounts || []}
                            filter={getAllEmailsFilters}
                            onFilterChange={(value: GetAllEmailsFilters) => setGetAllEmailsFilters(value)}
                        />
                        <SearchHeader value={searchValue} onChange={setSearchValue} placeholder={UI_CONSTANTS.PLACEHOLDERS.SEARCH_EMAILS} />
                        <EmailMenuBarOptions emailIds={selectedEmails} />
                    </div>
                    <div></div>
                    <div className="flex h-[calc(110vh-250px)] w-full flex-col">
                        <EmailListTable data={emailsData?.data || []} page={page} selectedEmails={selectedEmails} onEmailSelect={handleEmailSelect} />
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
