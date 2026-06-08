'use client';

import React from 'react';

import PageHeader from '@shared/components/header/PageHeader';
import Loader from '@shared/components/loader';
import AccountsPageInfoCard from '../components/AccountsPageInfoCard';
import ProviderAccountList from '../components/ProviderAccountList';
import { useAccountsPage } from '../hooks';

const AccountsPage: React.FC = () => {
    const { providers, groups, connectProvider, isLoading } = useAccountsPage();

    if (isLoading) {
        return <Loader />;
    }

    return (
        <>
            <div className="flex w-full flex-col items-center justify-center">
                <PageHeader
                    title="Connected Accounts"
                    button={true}
                    dropdownOptions={providers}
                    dropdownMenuItemClick={(option) => connectProvider(option.name)}
                />
                <div className="mt-2 flex h-full w-[98%] flex-col justify-center gap-6 rounded-xl px-2">
                    <ProviderAccountList groups={groups} onConnectProvider={connectProvider} />
                </div>
                <div className="mt-12 px-4 md:mt-24">
                    <AccountsPageInfoCard />
                </div>
            </div>
        </>
    );
};

export default AccountsPage;
