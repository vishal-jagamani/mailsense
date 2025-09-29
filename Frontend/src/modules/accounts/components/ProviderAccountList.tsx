'use client';

import { Card, CardContent } from '@/shared/ui/card';
import { encrypt } from '@/shared/utils/crypto';
import { useAuthStore } from '@/store';
import gmailIcon from '@assets/icons/gmail/icons8-gmail-240.png';
import outlookIcon from '@assets/icons/outlook/icons8-outlook-240.svg';
import { Plus } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { useAccountProviderQuery, useAccountQuery, useGetAccountsQuery } from '../services/useAccountQuery';
import AccountCard from './AccountCard';

const iconMapping = [
    { name: 'outlook', icon: outlookIcon },
    { name: 'gmail', icon: gmailIcon },
];

const ProviderAccountList: React.FC = () => {
    const [provider, setProvider] = useState<string>('');

    const { user: currentUser } = useAuthStore();
    const { data: accountProvidersData } = useAccountProviderQuery();
    const { data: accounts } = useGetAccountsQuery(currentUser?.id || '', { enabled: !!currentUser?.id });
    const { data: accountData } = useAccountQuery(provider, { enabled: !!provider });

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
                    return (
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
                            <div className="flex flex-wrap items-center gap-2">
                                {accounts &&
                                    accounts.length > 0 &&
                                    accounts
                                        .filter((account) => account.provider === provider.name)
                                        .map((account) => {
                                            return <AccountCard key={account.id} account={account} />;
                                        })
                                        .concat(
                                            <Card
                                                className="hover:bg-muted bg-background cursor-pointer border-2 border-dashed py-4"
                                                key="add-account"
                                                onClick={() => setProvider(provider.name)}
                                            >
                                                <CardContent className="flex items-center gap-2">
                                                    <Plus size={14} />
                                                    <p>Add Account</p>
                                                </CardContent>
                                            </Card>,
                                        )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

export default ProviderAccountList;
