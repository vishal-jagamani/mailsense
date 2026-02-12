'use client';

import APILoader from '@/shared/components/apiLoader';
import { EMAILS_PAGE_SIZE, MESSAGES } from '@/shared/constants';
import { UseDebounceQuery } from '@/shared/hooks/useDebounceQuery';
import { GetEmailsResponse } from '@/shared/types/email.types';
import { useAuthStore } from '@/store';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import EmailListTable from './components/EmailListTable';
import { useFetchEmails } from './services/useHomeApi';
import PaginationComponent from '@/shared/components/table/Pagination';

const HomePage = () => {
    const { user } = useAuthStore();
    const searchParams = useSearchParams();

    const [page, setPage] = useState(() => {
        const pageParam = searchParams.get('page');
        return pageParam ? parseInt(pageParam) : 1;
    });
    const [pageSize, setPageSize] = useState(EMAILS_PAGE_SIZE);
    const [searchValue, setSearchValue] = useState('');
    const [emailsData, setEmailsData] = useState<GetEmailsResponse | null>(null);
    const debouncedSearchValue = UseDebounceQuery({ text: searchValue, delay: 500 });
    const [errorShown, setErrorShown] = useState<boolean>(false);

    const { mutate: refetchEmails, isPending: isLoadingEmails, isError: isEmailError } = useFetchEmails();

    const fetchEmailsData = useCallback(() => {
        if (!user) return;
        const currentPage = debouncedSearchValue !== undefined && debouncedSearchValue !== '' ? 1 : page;
        refetchEmails({
            userId: user.id,
            size: pageSize,
            page: currentPage,
            filters: {
                searchText: debouncedSearchValue || undefined,
            },
        });
    }, [user, page, pageSize, debouncedSearchValue, refetchEmails]);

    useEffect(() => {
        if (debouncedSearchValue !== undefined && debouncedSearchValue !== '') {
            setPage(1);
        }
    }, [debouncedSearchValue]);

    useEffect(() => {
        fetchEmailsData();
    }, [fetchEmailsData]);

    useEffect(() => {
        if (emailsData) {
            setEmailsData(emailsData);
        }
    }, [emailsData]);

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
        <div className="flex items-center justify-center gap-4 px-4 py-2">
            <div className="flex h-full w-full flex-col items-center justify-center gap-6 rounded-xl">
                <APILoader show={isLoadingEmails} />
                <p>Emails</p>
                <EmailListTable data={emailsData?.data || []} page={page} />
                <PaginationComponent
                    total={emailsData?.total || 0}
                    currentPage={page}
                    onPageChange={setPage}
                    onPageSizeChange={handlePageSizeChange}
                    pageSize={pageSize}
                />
            </div>
        </div>
    );
};

export default HomePage;
