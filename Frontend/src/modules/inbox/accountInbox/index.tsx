'use client';

import { useGetAccountDetailsQuery } from '@/modules/accounts/services/useAccountApi';
import EmailListTable from '@/modules/home/components/EmailListTable';
import { useFetchEmailsByAccount } from '@/modules/home/services/useHomeApi';
import APILoader from '@/shared/components/apiLoader';
import SearchHeader from '@/shared/components/inputs/SearchHeader';
import Loader from '@/shared/components/loader';
import { EMAILS_PAGE_SIZE } from '@/shared/constants';
import { UseDebounceQuery } from '@/shared/hooks/useDebounceQuery';
import { useBreadcrumbStore } from '@/shared/store/breadcrumb.store';
import { Email } from '@/shared/types/email.types';
import { useEffect, useState } from 'react';
import { useSearchEmails } from '../services/useInboxApi';
import { useAuthStore } from '@/store';
import { toast } from 'sonner';

const AccountInboxPage: React.FC<{ account: string }> = ({ account }) => {
    const { user } = useAuthStore();

    const [page, setPage] = useState(1);
    const [searchValue, setSearchValue] = useState('');
    const [searchedEmailsData, setSearchedEmailsData] = useState<Email[]>([]);
    const debouncedSearchValue = UseDebounceQuery({ text: searchValue, delay: 500 });

    const { data: accountData } = useGetAccountDetailsQuery(account);
    const {
        data: emails,
        isLoading: isLoadingEmails,
        refetch: refetchEmails,
    } = useFetchEmailsByAccount(account, !!account, { page, size: EMAILS_PAGE_SIZE });
    const { mutate: searchEmails, isPending: isLoadingSearchEmails, data: searchedEmails, error: searchError } = useSearchEmails();

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
        if (account) {
            refetchEmails();
        }
    }, [account, refetchEmails]);

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
        toast.error('Error searching emails', { duration: 3000 });
    }, [true]);

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
                    <div className="flex h-[calc(110vh-200px)] w-full flex-col items-center justify-center gap-6 rounded-xl">
                        <EmailListTable data={searchedEmailsData.length > 0 ? searchedEmailsData : emails?.data || []} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default AccountInboxPage;
