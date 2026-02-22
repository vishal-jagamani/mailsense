'use client';

import PageHeader from '@/shared/components/header/PageHeader';
import { useBreadcrumbStore } from '@/shared/store/breadcrumb.store';
import { encrypt } from '@/shared/utils/crypto';
import { useAuthStore } from '@/store';
import React, { useEffect, useState } from 'react';
import ProviderAccountList from './components/ProviderAccountList';
import { useAccountProviderQuery, useAccountQuery } from './services/useAccountApi';
import MoreAccountProviderComingSoon from './components/MoreAccountProviderComingSoon';

const AccountsPage: React.FC = () => {
    const [provider, setProvider] = useState<string>('');

    const { user: currentUser } = useAuthStore();
    const { data: accountProvidersData } = useAccountProviderQuery();
    const { data: accountData } = useAccountQuery(provider, { enabled: !!provider });

    useEffect(() => {
        useBreadcrumbStore.setState({ items: [{ title: 'Accounts', url: '/accounts' }] });
    }, []);

    useEffect(() => {
        if (provider && accountData) {
            const encryptedUser = encrypt(JSON.stringify(currentUser));
            const url = `${accountData?.url}&state=${encodeURIComponent(encryptedUser)}`;
            window.location.href = url;
        }
    }, [provider, accountData, currentUser]);

    return (
        <>
            <div className="mt-6 flex w-full flex-col items-center justify-center">
                <PageHeader
                    title="Connected Accounts"
                    button={true}
                    dropdownOptions={accountProvidersData}
                    dropdownMenuItemClick={(option) => setProvider(option.name)}
                />
                <div className="mt-2 flex h-full w-[98%] flex-col justify-center gap-6 rounded-xl">
                    <ProviderAccountList />
                </div>
                <div className="mt-36 md:mt-48 px-4">
                    <MoreAccountProviderComingSoon />
                </div>
            </div>
        </>
    );
};

export default AccountsPage;
