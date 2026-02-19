'use client';

import { useGetAccountDetailsQuery } from '@/modules/accounts/services/useAccountApi';
import EmailListTable from '@/modules/home/components/EmailListTable';
import { useFetchEmails } from '@/modules/home/services/useHomeApi';
import APILoader from '@/shared/components/apiLoader';
import SearchHeader from '@/shared/components/inputs/SearchHeader';
import PaginationComponent from '@/shared/components/table/Pagination';
import { EMAILS_PAGE_SIZE, MESSAGES } from '@/shared/constants';
import { UI_CONSTANTS } from '@/shared/constants/ui';
import { UseDebounceQuery } from '@/shared/hooks/useDebounceQuery';
import { useBreadcrumbStore } from '@/shared/constants/store/breadcrumb.store';
import { GetEmailsResponse } from '@/shared/types/email.types';
import { useAuthStore } from '@/store';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

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
            },
        });
    }, [user, account, pageSize, page, debouncedSearchValue, refetchEmails]);

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

    return (
        <>
            <div className="flex items-center justify-center gap-4 px-4 py-2">
                <div className="flex h-full w-full flex-col items-center justify-center gap-4">
                    <APILoader show={isLoadingEmails} />
                    <div className="w-full">
                        <SearchHeader value={searchValue} onChange={setSearchValue} placeholder={UI_CONSTANTS.PLACEHOLDERS.SEARCH_EMAILS} />
                    </div>
                    <div className="flex h-[calc(110vh-200px)] w-full flex-col items-center justify-center gap-6 rounded-xl">
                        <EmailListTable data={emailsData?.data || []} page={page} />
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
