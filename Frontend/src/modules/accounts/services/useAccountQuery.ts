import { QUERY_KEYS } from '@shared/config/query-keys';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { connectAccount, getAccountProvider } from './account.api';

type ConnectAccountResult = Awaited<ReturnType<typeof connectAccount>>;

type Options = Omit<UseQueryOptions<ConnectAccountResult, Error, ConnectAccountResult, [string, string]>, 'queryKey' | 'queryFn'>;

export const useAccountQuery = (provider: string, options?: Options) => {
    return useQuery({
        queryKey: [QUERY_KEYS.ACCOUNTS, provider],
        queryFn: () => connectAccount(provider),
        staleTime: 5 * 60 * 1000,
        ...options,
    });
};

export const useAccountProviderQuery = () => {
    return useQuery({ queryKey: [QUERY_KEYS.ACCOUNT_PROVIDERS], queryFn: () => getAccountProvider(), staleTime: 5 * 60 * 1000 });
};
