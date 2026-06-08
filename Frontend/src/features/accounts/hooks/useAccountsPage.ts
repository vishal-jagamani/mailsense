import { useEffect } from 'react';

import { useAuthStore, useBreadcrumbStore } from '@shared/store';
import { useAccountProviderQuery, useGetAccountsQuery } from '../api/accounts.queries';
import { useConnectAccount } from './useConnectAccount';
import { useGroupedProviderAccounts } from './useGroupedProviderAccounts';

export const useAccountsPage = () => {
    const currentUser = useAuthStore((state) => state.user);

    const { data: providers, isLoading: providersLoading } = useAccountProviderQuery();
    const { data: accounts, isLoading: accountsLoading } = useGetAccountsQuery(currentUser?.id || '', {
        enabled: !!currentUser?.id,
    });

    const { connectProvider, connectError } = useConnectAccount();
    const groups = useGroupedProviderAccounts(providers, accounts);

    useEffect(() => {
        useBreadcrumbStore.setState({ items: [{ title: 'Accounts', url: '/accounts' }] });
    }, []);

    return {
        providers,
        accounts,
        groups,
        connectProvider,
        isLoading: providersLoading || accountsLoading,
        connectError,
    };
};
