'use client';

import { useGetAccountsQuery } from '@features/accounts/api/accounts.queries';
import { useGetAiSettingsQuery } from '../api/settings.queries';
import { UseGetAiSettingsQueryOptions } from '../types/ai-settings.types';
import { useUpdateAiSettingsMutation } from '../api/settings.mutation';
import { useAuthStore } from '@shared/store';
import { UserAIFeatureSettings } from '@mailsense/types';

export const useAiSettings = (options?: Partial<UseGetAiSettingsQueryOptions>) => {
    const user = useAuthStore((state) => state.user);
    const { data: aiSettingsData, isLoading: isLoadingAiSettings } = useGetAiSettingsQuery(options);
    const { data: accounts = [], isLoading: isLoadingAccounts } = useGetAccountsQuery(user?.id || '');
    const updateMutation = useUpdateAiSettingsMutation();

    const handleGlobalToggle = (enabled: boolean) => {
        updateMutation.mutate({ enabled });
    };

    const handleFeatureToggle = (feature: keyof UserAIFeatureSettings, checked: boolean) => {
        updateMutation.mutate({
            features: {
                [feature]: checked,
            },
        });
    };

    const handleAccountToggle = (accountId: string, enabled: boolean) => {
        const currentDisabled = aiSettingsData?.settings.disabledAccountIds ?? [];
        const nextDisabled = enabled ? currentDisabled.filter((id) => id !== accountId) : [...currentDisabled, accountId];

        updateMutation.mutate({ disabledAccountIds: nextDisabled });
    };

    return {
        aiSettings: { data: aiSettingsData, loading: isLoadingAiSettings },
        accounts: { data: accounts, loading: isLoadingAccounts },
        updateAiSettingsLoading: updateMutation.isPending,
        actions: {
            handleGlobalToggle,
            handleFeatureToggle,
            handleAccountToggle,
        },
    };
};
