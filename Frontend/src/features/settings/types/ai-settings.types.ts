import { AccountAttributes, GetUserAISettingsResponse, UpdateUserAISettingsPayload, UserAIFeatureSettings, UserAISettings } from '@mailsense/types';
import { SETTINGS_QUERY_KEYS } from '@shared/api';
import { UseMutationOptions, UseQueryOptions } from '@tanstack/react-query';

export interface GlobalAiToggleCardProps {
    enabled: boolean;
    consentGivenAt?: Date;
    globalFeatureFlag: boolean;
    onToggle: (checked: boolean) => void;
    isUpdating: boolean;
}

export interface AiFeatureTogglesCardProps {
    features: UserAIFeatureSettings;
    disabled: boolean;
    onToggleFeature: (feature: keyof UserAIFeatureSettings, checked: boolean) => void;
    isUpdating: boolean;
}

export interface PerAccountAiExclusionCardProps {
    accounts: AccountAttributes[];
    disabledAccountIds: string[];
    aiGloballyEnabled: boolean;
    onToggleAccount: (accountId: string, enabled: boolean) => void;
    isUpdating: boolean;
}

export interface AiSettingsTabProps {
    className?: string;
}

export interface AiSettingsHookData {
    settings: UserAISettings | undefined;
    globalFeatureFlag: boolean;
    accounts: AccountAttributes[];
    isLoading: boolean;
    isUpdating: boolean;
}

export interface AiSettingsHookActions {
    handleGlobalToggle: (checked: boolean) => void;
    handleFeatureToggle: (feature: keyof UserAIFeatureSettings, checked: boolean) => void;
    handleAccountToggle: (accountId: string, enabled: boolean) => void;
}

export interface AiSettingsHookReturn {
    data: AiSettingsHookData;
    actions: AiSettingsHookActions;
}

export type UseGetAiSettingsQueryOptions = Omit<
    UseQueryOptions<GetUserAISettingsResponse, Error, GetUserAISettingsResponse, typeof SETTINGS_QUERY_KEYS.USER_AI_SETTINGS>,
    'queryKey' | 'queryFn'
>;

export type UseUpdateAiSettingsMutationOptions = Omit<
    UseMutationOptions<GetUserAISettingsResponse, Error, UpdateUserAISettingsPayload>,
    'mutationFn'
>;
