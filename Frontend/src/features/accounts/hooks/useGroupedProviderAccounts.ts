import { useMemo } from 'react';

import { AccountProviders } from '@entities/account';
import { AccountAttributes } from '@mailsense/types';

export interface ProviderAccountGroup {
    provider: AccountProviders;
    accounts: AccountAttributes[];
}

export const useGroupedProviderAccounts = (providers?: AccountProviders[], accounts?: AccountAttributes[]) => {
    return useMemo<ProviderAccountGroup[]>(() => {
        if (!providers?.length) return [];

        return providers
            .map((provider) => ({
                provider,
                accounts: accounts?.filter((account) => account.provider === provider.name) ?? [],
            }))
            .filter((group) => group.accounts.length > 0);
    }, [providers, accounts]);
};
