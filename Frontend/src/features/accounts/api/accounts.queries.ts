import { AccountAttributes, UpdateAPIResponse } from '@mailsense/types';
import { QUERY_KEYS } from '@shared/api';
import { trackUserAction } from '@shared/monitoring';
import { AccountProviders } from '@shared/types';
import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UseGetAccountDetailsQueryOptions } from '../types/accounts-api.types';
import { connectAccount, getAccountDetails, getAccountProvider, getAccounts, syncAllAccounts } from './accounts.api';

export const useGetAccountsQuery = (userId: string, options?: UseGetAccountDetailsQueryOptions): UseQueryResult<AccountAttributes[]> => {
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

export const useGetAccountDetailsQuery = (accountId: string, options?: UseGetAccountDetailsQueryOptions): UseQueryResult<AccountAttributes> => {
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

export const useAccountQuery = (provider: string, options?: UseGetAccountDetailsQueryOptions) => {
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

    const mutation = useMutation<UpdateAPIResponse, Error, string>({
        mutationFn: (userId: string) => syncAllAccounts(userId),
        onSuccess: (result) => {
            toast.success(result.message, { duration: 3000 });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNTS] });
        },
        onError: () => {
            trackUserAction('api.error', 'Sync all accounts error', 'error');
            toast.error('Failed to trigger account sync');
        },
    });

    return {
        syncAllAccounts: mutation.mutate,
        isSyncing: mutation.isPending,
    };
};
