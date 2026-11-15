import { UpdateAPIResponse } from '@mailsense/types';
import { QUERY_KEYS } from '@shared/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EnableAccountPayload, UpdateAccountSettingsVariables } from '../types';
import { connectAccount, enableAccount, removeAccount, syncAccount, updateAccountSettings } from './accounts.api';

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
    return useMutation<UpdateAPIResponse, Error, EnableAccountPayload>({
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

export const useUpdateAccountSettingsMutation = () => {
    const queryClient = useQueryClient();
    return useMutation<UpdateAPIResponse, Error, UpdateAccountSettingsVariables>({
        mutationFn: ({ accountId, settings }) => updateAccountSettings(accountId, settings),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNTS] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_SYNC_SETTINGS] });
        },
    });
};
