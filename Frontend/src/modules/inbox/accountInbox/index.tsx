'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useGetAccountDetailsQuery } from '@/modules/accounts/services/useAccountApi';
import EmailListTable from '@/modules/home/components/EmailListTable';
import { useFetchEmails } from '@/modules/home/services/useHomeApi';
import APILoader from '@/shared/components/apiLoader';
import SearchHeader from '@/shared/components/inputs/SearchHeader';
import PaginationComponent from '@/shared/components/table/Pagination';
import { EMAILS_PAGE_SIZE, MESSAGES } from '@/shared/constants';
import { useBreadcrumbStore } from '@/shared/constants/store/breadcrumb.store';
import { UI_CONSTANTS } from '@/shared/constants/ui';
import { UseDebounceQuery } from '@/shared/hooks/useDebounceQuery';
import { GetEmailsResponse } from '@/shared/types/email.types';
import { GetAllEmailsFilters } from '@/shared/types/inbox.types';
import { useAuthStore } from '@/store';

import AccountEmailListFilter from './components/AccountEmailListFilter';
import AccountEmailMenuBarOptions from './components/AccountEmailMenuBarOptions';

const AccountInboxPage: React.FC<{ account: string }> = ({ account }) => {
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

    const { data: accountData } = useGetAccountDetailsQuery(account);
    const { data: emails, mutate: refetchEmails, isPending: isLoadingEmails, isError: isEmailError } = useFetchEmails();

    const fetchEmailsData = useCallback(() => {
        if (!user || !account) return;
        const currentPage = debouncedSearchValue !== undefined && debouncedSearchValue !== '' ? 1 : page;
        refetchEmails({
            userId: user?.id || '',
            size: pageSize,
            page: currentPage,
            filters: {
                accountId: [account],
                searchText: debouncedSearchValue || undefined,
                dateRange: getAllEmailsFilters?.dateRange,
            },
        });
    }, [user, account, pageSize, page, debouncedSearchValue, refetchEmails, getAllEmailsFilters]);

    useEffect(() => {
        if (debouncedSearchValue !== undefined && debouncedSearchValue !== '') {
            setPage(1);
        }
    }, [debouncedSearchValue]);

    useEffect(() => {
        if (accountData) {
            useBreadcrumbStore.setState({
                items: [
                    { title: 'Inbox', url: '/' },
                    { title: accountData?.emailAddress || '', url: `/inbox/${accountData?._id}` },
                ],
            });
        }
    }, [accountData]);

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
        router.replace(`/inbox/${account}?${params.toString()}`);
    }, [page]);

    useEffect(() => {
        if (isEmailError && !errorShown) {
            toast.error(MESSAGES.EMAIL_LOAD_ERROR, { duration: 3000 });
            setErrorShown(true);
        } else if (!isEmailError) {
            setErrorShown(false);
        }
    }, [isEmailError, errorShown]);

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
                    <APILoader show={isLoadingEmails} />
                    <div className="flex w-full gap-2">
                        <AccountEmailListFilter
                            filter={getAllEmailsFilters}
                            onFilterChange={(value: GetAllEmailsFilters) => setGetAllEmailsFilters(value)}
                        />
                        <SearchHeader value={searchValue} onChange={setSearchValue} placeholder={UI_CONSTANTS.PLACEHOLDERS.SEARCH_EMAILS} />
                        <AccountEmailMenuBarOptions emailIds={selectedEmails} />
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

export default AccountInboxPage;
