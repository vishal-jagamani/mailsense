import { QUERY_KEYS } from '@shared/api';
import { UpdateAPIResponse } from '@shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { connectAccount, enableAccount, removeAccount, syncAccount } from './accounts.api';

export const useConnectAccountMutation = () => {
    return useMutation<Awaited<ReturnType<typeof connectAccount>>, Error, string>({
        mutationFn: (provider) => connectAccount(provider),
    });
};

export const useSyncAccountMutation = () => {
    const queryClient = useQueryClient();
    return useMutation<UpdateAPIResponse, Error, string>({
        mutationFn: (accountId) => syncAccount(accountId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNTS] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNT_PROVIDERS] });
        },
    });
};

export const useEnableAccountMutation = () => {
    const queryClient = useQueryClient();
    return useMutation<UpdateAPIResponse, Error, { accountId: string; active: boolean }>({
        mutationFn: ({ accountId, active }) => enableAccount(accountId, active),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNTS] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNT_PROVIDERS] });
        },
    });
};

export const useRemoveAccountMutation = () => {
    const queryClient = useQueryClient();
    return useMutation<UpdateAPIResponse, Error, string>({
        mutationFn: (accountId) => removeAccount(accountId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNTS] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNT_PROVIDERS] });
        },
    });
};
