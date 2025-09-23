'use client';

import { useAuthStore } from '@/shared/store';
import { encrypt } from '@/shared/utils/crypto';
import outlookIcon from '@assets/icons/outlook/icons8-outlook-144.svg';
import { Button } from '@shared/ui/button';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useAccountProviderQuery, useAccountQuery } from '../accounts/services/useAccountQuery';

const HomePage = () => {
    const [provider, setProvider] = useState<string>('');

    const { data: accountProvidersData } = useAccountProviderQuery();
    const { data: accountData } = useAccountQuery(provider, { enabled: !!provider });

    const { user: currentUser } = useAuthStore();

    useEffect(() => {
        if (provider && accountData) {
            const encryptedUser = encrypt(JSON.stringify(currentUser));
            console.log('encryptedUser', encodeURIComponent(encryptedUser));
            const url = `${accountData?.url}&state=${encodeURIComponent(encryptedUser)}`;
            window.location.href = url;
        }
    }, [provider, accountData, currentUser]);

    return (
        <div className="flex flex-1 items-center justify-center gap-4 overflow-hidden p-4">
            <div className="flex h-full w-full flex-col items-center justify-center gap-6 rounded-xl border border-gray-400 p-10">
                <p>Connect your account to start using the app</p>
                {accountProvidersData &&
                    accountProvidersData.map((provider: { id: string; name: string; displayName: string }) => (
                        <>
                            <div key={provider?.id}>
                                <Button
                                    onClick={() => {
                                        setProvider(provider?.name);
                                    }}
                                >
                                    <Image src={outlookIcon} alt={provider?.displayName} width={24} height={24} />
                                    Connect {provider?.displayName}
                                </Button>
                            </div>
                        </>
                    ))}
            </div>
        </div>
    );
};

export default HomePage;
