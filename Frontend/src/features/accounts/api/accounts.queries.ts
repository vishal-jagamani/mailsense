import { AccountProviders } from '@entities/account';
import { AccountAttributes, UpdateAPIResponse } from '@mailsense/types';
import { QUERY_KEYS } from '@shared/api';
import { useQuery, useQueryClient, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { connectAccount, getAccountDetails, getAccountProvider, getAccounts, syncAllAccounts } from './accounts.api';

type ConnectAccountResult = Awaited<ReturnType<typeof connectAccount>>;

type Options = Omit<UseQueryOptions<ConnectAccountResult, Error, ConnectAccountResult, [string, string]>, 'queryKey' | 'queryFn'>;

export const useGetAccountsQuery = (userId: string, options?: Options): UseQueryResult<AccountAttributes[]> => {
    return useQuery({
        queryKey: [QUERY_KEYS.ACCOUNTS, userId],
        queryFn: () => getAccounts(),
        refetchInterval: (query) => {
            const data = query.state.data as AccountAttributes[] | undefined;
            if (Array.isArray(data) && data.some((acc) => acc.syncInProgress)) {
                return 3000;
            }
            return false;
        },
        ...options,
    });
};

export const useGetAccountDetailsQuery = (accountId: string, options?: Options): UseQueryResult<AccountAttributes> => {
    return useQuery({
        queryKey: [QUERY_KEYS.ACCOUNTS, accountId],
        queryFn: () => getAccountDetails(accountId),
        refetchInterval: (query) => {
            const data = query.state.data as AccountAttributes | undefined;
            if (data?.syncInProgress) {
                return 3000;
            }
            return false;
        },
        ...options,
    });
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
