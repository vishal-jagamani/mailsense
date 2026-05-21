'use client';

import React, { useEffect, useState } from 'react';

import PageHeader from '@shared/components/header/PageHeader';
import { useAuthStore, useBreadcrumbStore } from '@shared/store';
import { encrypt } from '@shared/utils/crypto';
import MoreAccountProviderComingSoon from './components/MoreAccountProviderComingSoon';
import ProviderAccountList from './components/ProviderAccountList';
import { useAccountProviderQuery, useAccountQuery } from './services/useAccountApi';

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
            <div className="flex w-full flex-col items-center justify-center">
                <PageHeader
                    title="Connected Accounts"
                    button={true}
                    dropdownOptions={accountProvidersData}
                    dropdownMenuItemClick={(option) => setProvider(option.name)}
                />
                <div className="mt-2 flex h-full w-[98%] flex-col justify-center gap-6 rounded-xl px-2">
                    <ProviderAccountList />
                </div>
                <div className="mt-12 px-4 md:mt-24">
                    <MoreAccountProviderComingSoon />
                </div>
            </div>
        </>
    );
};

export default AccountsPage;
