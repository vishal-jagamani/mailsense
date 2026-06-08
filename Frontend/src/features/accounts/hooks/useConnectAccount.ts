import { useCallback } from 'react';

import { useAuthStore } from '@shared/store';
import { encrypt } from '@shared/utils/crypto';
import { useConnectAccountMutation } from '../api/accounts.mutations';

export const useConnectAccount = () => {
    const currentUser = useAuthStore((state) => state.user);
    const { mutate: connectAccount, error } = useConnectAccountMutation();

    const connectProvider = useCallback(
        (provider: string) => {
            connectAccount(provider, {
                onSuccess: (accountData) => {
                    if (!accountData?.url || !currentUser) return;

                    const encryptedUser = encrypt(JSON.stringify(currentUser));
                    const url = `${accountData.url}&state=${encodeURIComponent(encryptedUser)}`;

                    window.location.href = url;
                },
            });
        },
        [connectAccount, currentUser],
    );

    return {
        connectProvider,
        connectError: error,
    };
};
