import { useMemo } from 'react';

import { AccountAttributes } from '@mailsense/types';
import { AccountProviders } from '@shared/types';
import { ProviderAccountGroup } from '../types/accounts-hooks.types';

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
