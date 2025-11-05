'use client';

import { useGetAccountDetailsQuery } from '@/modules/accounts/services/useAccountApi';
import EmailListTable from '@/modules/home/components/EmailListTable';
import { useFetchEmailsByAccount } from '@/modules/home/services/useHomeApi';
import Loader from '@/shared/components/loader';
import { useBreadcrumbStore } from '@/shared/store/breadcrumb.store';
import { useEffect } from 'react';

const AccountInboxPage: React.FC<{ account: string }> = ({ account }) => {
    const { data: accountData } = useGetAccountDetailsQuery(account);
    const { data: emails, isLoading: isLoadingEmails, refetch: refetchEmails } = useFetchEmailsByAccount(account, !!account);

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
    }, [account]);

    if (isLoadingEmails) {
        return <Loader />;
    }

    return (
        <>
            <div className="flex items-center justify-center gap-4 px-4 py-2">
                <div className="flex h-full w-full flex-col items-center justify-center gap-6 rounded-xl">
                    <EmailListTable data={emails?.data || []} />
                </div>
            </div>
        </>
    );
};

export default AccountInboxPage;
