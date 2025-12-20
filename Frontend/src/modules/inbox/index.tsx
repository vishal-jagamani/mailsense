'use client';

import SearchHeader from '@/shared/components/inputs/SearchHeader';
import Loader from '@/shared/components/loader';
import { UseDebounceQuery } from '@/shared/hooks/useDebounceQuery';
import { useBreadcrumbStore } from '@/shared/store/breadcrumb.store';
import { useAuthStore } from '@/store';
import React, { useEffect, useState } from 'react';
import EmailListTable from '../home/components/EmailListTable';
import { useFetchEmails } from '../home/services/useHomeApi';
import { useSearchEmails } from './services/useInboxApi';
import APILoader from '@/shared/components/apiLoader';
import { Email } from '@/shared/types/email.types';

const InboxPage: React.FC = () => {
    const { user } = useAuthStore();
    const { data: emails, refetch: refetchEmails, isLoading: isLoadingEmails } = useFetchEmails(user?.id || '', !!user);
    const { mutate: searchEmails, isPending: isLoadingSearchEmails, data: searchedEmails, error: searchError } = useSearchEmails();

    const [searchValue, setSearchValue] = useState('');
    const [searchedEmailsData, setSearchedEmailsData] = useState<Email[]>([]);
    const debouncedSearchValue = UseDebounceQuery({ text: searchValue, delay: 500 });

    console.log('searchValue', searchValue, debouncedSearchValue);

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
                <div className="flex h-full w-full flex-col items-center justify-center gap-6 rounded-xl">
                    {/* <p>Emails</p> */}
                    <APILoader show={isLoadingSearchEmails} />
                    <SearchHeader value={searchValue} onChange={setSearchValue} />
                    <EmailListTable data={searchedEmailsData.length > 0 ? searchedEmailsData : emails?.data || []} />
                </div>
            </div>
        </>
    );
};

export default InboxPage;
