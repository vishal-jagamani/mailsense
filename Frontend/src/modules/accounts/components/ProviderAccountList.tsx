'use client';

import Image from 'next/image';
import React, { useEffect, useState } from 'react';

import { ACCOUNT_PROVIDER, AccountAttributes } from '@/shared/types/account.types';
import { Card, CardContent } from '@/shared/ui/card';
import { encrypt } from '@/shared/utils/crypto';
import { useAuthStore } from '@/store';
import gmailIcon from '@assets/icons/gmail/icons8-gmail-240.png';
import outlookIcon from '@assets/icons/outlook/icons8-outlook-240.svg';
import { Plus } from 'lucide-react';
import { useAccountProviderQuery, useAccountQuery, useGetAccountsQuery } from '../services/useAccountApi';
import AccountCard from './AccountCard';

const iconMapping = [
    { name: 'outlook', icon: outlookIcon },
    { name: 'gmail', icon: gmailIcon },
];

const ProviderAccountList: React.FC = () => {
    const [provider, setProvider] = useState<string>('');
    const [accountsToDisplay, setAccountsToDisplay] = useState<AccountAttributes[]>([]);

    const { user: currentUser } = useAuthStore();
    const { data: accountProvidersData } = useAccountProviderQuery();
    const { data: accounts } = useGetAccountsQuery(currentUser?.id || '', { enabled: !!currentUser?.id });
    const { data: accountData } = useAccountQuery(provider, { enabled: !!provider });

    // TODO: Don't show outlook option, need to change this post outlook connector release
    useEffect(() => {
        if (accounts) {
            const filteredAccounts = accounts.filter((account) => account.provider !== ACCOUNT_PROVIDER.OUTLOOK);
            setAccountsToDisplay(filteredAccounts);
        }
    }, [accounts]);

    useEffect(() => {
        if (provider && accountData) {
            const encryptedUser = encrypt(JSON.stringify(currentUser));
            const url = `${accountData?.url}&state=${encodeURIComponent(encryptedUser)}`;
            window.location.href = url;
        }
    }, [provider, accountData, currentUser]);

    return (
        <>
            <div className="flex flex-col gap-10 select-none">
                {accountProvidersData?.map((provider) => {
                    const filteredAccounts = accountsToDisplay?.filter((account) => account.provider === provider.name);
                    return filteredAccounts && filteredAccounts?.length > 0 ? (
                        <div key={provider.id} className="flex flex-col gap-2">
                            <div className="flex items-center gap-1">
                                <Image
                                    draggable={false}
                                    src={iconMapping?.find((item) => item.name === provider.name)?.icon}
                                    alt={provider.name}
                                    className="size-6"
                                />
                                <p className="text-lg font-semibold">{provider.displayName}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-4">
                                {accountsToDisplay &&
                                    accountsToDisplay.length > 0 &&
                                    accountsToDisplay
                                        .map((account) => {
                                            return <AccountCard key={account.id} account={account} />;
                                        })
                                        .concat(
                                            <Card
                                                className="hover:bg-muted bg-background h-16 cursor-pointer border-2 border-dashed py-4"
                                                key="add-account"
                                                onClick={() => setProvider(provider.name)}
                                            >
                                                <CardContent className="flex h-full items-center gap-1">
                                                    <Plus size={18} />
                                                    <p className="text-sm font-semibold">Add Account</p>
                                                </CardContent>
                                            </Card>,
                                        )}
                            </div>
                        </div>
                    ) : null;
                })}
            </div>
        </>
    );
};

export default ProviderAccountList;
