'use client';

import { useGetAccountDetailsQuery } from '@/modules/accounts/services/useAccountApi';
import { useBreadcrumbStore } from '@/shared/store/breadcrumb.store';
import { useEffect } from 'react';

const AccountInboxPage = ({ account }: { account: string }) => {
    const { data: accountData } = useGetAccountDetailsQuery(account);

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

    return (
        <>
            <div>
                <p>Account Inbox: {accountData?.emailAddress}</p>
            </div>
        </>
    );
};

export default AccountInboxPage;
