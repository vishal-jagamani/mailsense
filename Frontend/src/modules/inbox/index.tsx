'use client';

import APILoader from '@/shared/components/apiLoader';
import SearchHeader from '@/shared/components/inputs/SearchHeader';
import Loader from '@/shared/components/loader';
import { EMAILS_PAGE_SIZE } from '@/shared/constants';
import { UseDebounceQuery } from '@/shared/hooks/useDebounceQuery';
import { useBreadcrumbStore } from '@/shared/store/breadcrumb.store';
import { Email } from '@/shared/types/email.types';
import { useAuthStore } from '@/store';
import React, { Suspense, useEffect, useState } from 'react';
import EmailListTable from '../home/components/EmailListTable';
import { useFetchEmails } from '../home/services/useHomeApi';
import { useSearchEmails } from './services/useInboxApi';
import PaginationComponent from '@/shared/components/table/Pagination';
import { useRouter, useSearchParams } from 'next/navigation';

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
    const [searchedEmailsData, setSearchedEmailsData] = useState<Email[]>([]);
    const debouncedSearchValue = UseDebounceQuery({ text: searchValue, delay: 500 });

    const { data: emails, refetch: refetchEmails, isLoading: isLoadingEmails } = useFetchEmails(user?.id || '', !!user, { page, size: pageSize });
    const { mutate: searchEmails, isPending: isLoadingSearchEmails, data: searchedEmails, error: searchError } = useSearchEmails();

    useEffect(() => {
        if (user) {
            refetchEmails();
        }
    }, [user, refetchEmails, page, pageSize]);

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', page.toString());
        router.replace(`/inbox?${params.toString()}`);
    }, [page]);

    useEffect(() => {
        if (debouncedSearchValue) {
            searchEmails({ searchText: debouncedSearchValue, userId: user?.id || '' });
        } else {
            setSearchedEmailsData([]);
        }
    }, [debouncedSearchValue]);

    useEffect(() => {
        if (searchedEmails) {
            setSearchedEmailsData(searchedEmails.data);
        }
    }, [searchedEmails]);

    useEffect(() => {
        useBreadcrumbStore.setState({ items: [{ title: 'Inbox', url: '/inbox' }] });
    }, []);

    const handlePageSizeChange = (newSize: number) => {
        setPage(1);
        setPageSize(newSize);
    };

    if (isLoadingEmails) {
        return <Loader />;
    }

    return (
        <>
            <div className="flex items-center justify-center gap-4 px-4 py-2">
                <div className="flex h-full w-full flex-col items-center justify-center gap-4">
                    <APILoader show={isLoadingSearchEmails} />
                    <div className="w-full">
                        <SearchHeader value={searchValue} onChange={setSearchValue} placeholder="Search emails..." />
                    </div>
                    <div className="flex h-[calc(110vh-250px)] w-full flex-col">
                        <EmailListTable data={searchedEmailsData.length > 0 ? searchedEmailsData : emails?.data || []} page={page} />
                    </div>
                    <PaginationComponent
                        total={emails?.total || 0}
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
