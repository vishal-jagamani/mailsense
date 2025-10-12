import { QUERY_KEYS } from '@shared/config/query-keys';
import { useMutation, useQuery, useQueryClient, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { connectAccount, getAccountProvider, getAccounts, removeAccount } from './account.api';
import { AccountAttributes, AccountProviders } from '@/shared/types/account.types';

type ConnectAccountResult = Awaited<ReturnType<typeof connectAccount>>;

type Options = Omit<UseQueryOptions<ConnectAccountResult, Error, ConnectAccountResult, [string, string]>, 'queryKey' | 'queryFn'>;

export const useGetAccountsQuery = (userId: string, options?: Options): UseQueryResult<AccountAttributes[]> => {
    return useQuery({ queryKey: [QUERY_KEYS.ACCOUNTS, userId], queryFn: () => getAccounts(userId), ...options });
};

export const useAccountQuery = (provider: string, options?: Options) => {
    return useQuery({
        queryKey: [QUERY_KEYS.ACCOUNTS, provider],
        queryFn: () => connectAccount(provider),
        staleTime: 5 * 60 * 1000,
        ...options,
    });
};

export const useAccountProviderQuery = (): UseQueryResult<AccountProviders[]> => {
    return useQuery({ queryKey: [QUERY_KEYS.ACCOUNT_PROVIDERS], queryFn: () => getAccountProvider(), staleTime: 5 * 60 * 1000 });
};

export const useRemoveAccountQuery = () => {
    const queryClient = useQueryClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return useMutation<any, any, string>({
        mutationFn: (accountId) => removeAccount(accountId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNTS] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNT_PROVIDERS] });
        },
    });
};
