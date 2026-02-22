import { AccountAttributes, AccountProviders } from '@/shared/types/account.types';
import { UpdateAPIResponse } from '@/shared/types/api.types';
import { QUERY_KEYS } from '@shared/config/query-keys';
import { useMutation, useQuery, useQueryClient, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { connectAccount, getAccountDetails, getAccountProvider, getAccounts, removeAccount, syncAccount, syncAllAccounts } from './account.api';

type ConnectAccountResult = Awaited<ReturnType<typeof connectAccount>>;

type Options = Omit<UseQueryOptions<ConnectAccountResult, Error, ConnectAccountResult, [string, string]>, 'queryKey' | 'queryFn'>;

export const useGetAccountsQuery = (userId: string, options?: Options): UseQueryResult<AccountAttributes[]> => {
    return useQuery({ queryKey: [QUERY_KEYS.ACCOUNTS, userId], queryFn: () => getAccounts(userId), ...options });
};

export const useGetAccountDetailsQuery = (accountId: string, options?: Options): UseQueryResult<AccountAttributes> => {
    return useQuery({ queryKey: [QUERY_KEYS.ACCOUNTS, accountId], queryFn: () => getAccountDetails(accountId), ...options });
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

export const useSyncAccountQuery = () => {
    const queryClient = useQueryClient();
    return useMutation<UpdateAPIResponse, Error, string>({
        mutationFn: (accountId) => syncAccount(accountId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNTS] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNT_PROVIDERS] });
        },
    });
};

export const useSyncAllAccounts = () => {
    const queryClient = useQueryClient();

    const handleSyncAllAccounts = async (userId: string): Promise<UpdateAPIResponse> => {
        try {
            const result = await syncAllAccounts(userId);
            toast.success(result.message, { duration: 3000 });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNTS] });
            return result;
        } catch (error) {
            console.error('Sync all accounts error:', error);
            throw error;
        }
    };

    return { syncAllAccounts: handleSyncAllAccounts };
};

export const useRemoveAccountQuery = () => {
    const queryClient = useQueryClient();
    return useMutation<UpdateAPIResponse, Error, string>({
        mutationFn: (accountId) => removeAccount(accountId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNTS] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNT_PROVIDERS] });
        },
    });
};
