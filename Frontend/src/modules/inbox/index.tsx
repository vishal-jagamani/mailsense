'use client';

import APILoader from '@/shared/components/apiLoader';
import SearchHeader from '@/shared/components/inputs/SearchHeader';
import Loader from '@/shared/components/loader';
import { EMAILS_PAGE_SIZE } from '@/shared/constants';
import { UseDebounceQuery } from '@/shared/hooks/useDebounceQuery';
import { useBreadcrumbStore } from '@/shared/store/breadcrumb.store';
import { Email } from '@/shared/types/email.types';
import { useAuthStore } from '@/store';
import React, { useEffect, useState } from 'react';
import EmailListTable from '../home/components/EmailListTable';
import { useFetchEmails } from '../home/services/useHomeApi';
import { useSearchEmails } from './services/useInboxApi';

const InboxPage: React.FC = () => {
    const [page, setPage] = useState(1);
    const { user } = useAuthStore();
    const {
        data: emails,
        refetch: refetchEmails,
        isLoading: isLoadingEmails,
    } = useFetchEmails(user?.id || '', !!user, { page, size: EMAILS_PAGE_SIZE });
    const { mutate: searchEmails, isPending: isLoadingSearchEmails, data: searchedEmails, error: searchError } = useSearchEmails();

    const [searchValue, setSearchValue] = useState('');
    const [searchedEmailsData, setSearchedEmailsData] = useState<Email[]>([]);
    const debouncedSearchValue = UseDebounceQuery({ text: searchValue, delay: 500 });

    useEffect(() => {
        if (user) {
            refetchEmails();
        }
    }, [user, refetchEmails]);

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
                    <div className="flex h-[calc(110vh-200px)] w-full">
                        <EmailListTable data={searchedEmailsData.length > 0 ? searchedEmailsData : emails?.data || []} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default InboxPage;
