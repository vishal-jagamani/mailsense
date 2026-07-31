import { useGetAccountsQuery } from '@features/accounts/api/accounts.queries';
import { ACCOUNT_SYNC_MODE } from '@mailsense/types';
import { useAuthStore } from '@shared/store';
import { useUpdateUserSettingsMutation } from '../api/settings.mutation';
import { useGetUserSettingsQuery } from '../api/settings.queries';

export const useAccountSettings = () => {
    const user = useAuthStore((state) => state.user);
    const { data: userSettings, isLoading: isLoadingSettings } = useGetUserSettingsQuery(user?.id);
    const { data: accounts = [], isLoading: isLoadingAccounts } = useGetAccountsQuery(user?.id || '');
    const updateSettingsMutation = useUpdateUserSettingsMutation();

    const syncSettings = userSettings?.account?.syncSettings || {
        globalAutoSync: true,
        syncMode: ACCOUNT_SYNC_MODE.CUSTOM_PER_ACCOUNT,
        globalSyncInterval: 15,
        defaultSyncInterval: 15,
    };

    const handleGlobalAutoSyncToggle = (checked: boolean) => {
        updateSettingsMutation.mutate({
            account: {
                syncSettings: {
                    ...syncSettings,
                    globalAutoSync: checked,
                },
            },
        });
    };

    const handleSyncModeChange = (mode: ACCOUNT_SYNC_MODE) => {
        updateSettingsMutation.mutate({
            account: {
                syncSettings: {
                    ...syncSettings,
                    syncMode: mode,
                },
            },
        });
    };

    const handleGlobalIntervalChange = (val: string) => {
        const interval = parseInt(val, 10);
        updateSettingsMutation.mutate({
            account: {
                syncSettings: {
                    ...syncSettings,
                    globalSyncInterval: interval,
                },
            },
        });
    };

    return {
        data: { syncSettings },
        userSettings: { isLoading: isLoadingSettings },
        accounts: { data: accounts, isLoading: isLoadingAccounts },
        actions: { handleGlobalAutoSyncToggle, handleSyncModeChange, handleGlobalIntervalChange },
    };
};
