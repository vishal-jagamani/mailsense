import { APIResponse, GetUserAISettingsResponse, ProfileSettingsDataObject, UserSettings } from '@mailsense/types';
import { QUERY_KEYS, SETTINGS_QUERY_KEYS } from '@shared/api';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { UseGetAiSettingsQueryOptions } from '../types/ai-settings.types';
import { UseGetUseSettingsQueryOptions } from '../types/settings-api.types';
import { fetchUserAiSettings, getUserProfileSettings, getUserSettings } from './settings.api';

export const useGetProfileQuery = (enabled: boolean) => {
    return useQuery<APIResponse<ProfileSettingsDataObject>>({
        queryKey: [QUERY_KEYS.USER_PROFILE_SETTINGS],
        queryFn: () => getUserProfileSettings(),
        enabled,
    });
};

export const useGetUserSettingsQuery = (userId?: string, options?: UseGetUseSettingsQueryOptions): UseQueryResult<UserSettings> => {
    return useQuery({
        queryKey: [QUERY_KEYS.USER_SYNC_SETTINGS],
        queryFn: () => getUserSettings(),
        enabled: !!userId,
        ...options,
    });
};

export const useGetAiSettingsQuery = (options?: Partial<UseGetAiSettingsQueryOptions>) => {
    return useQuery<GetUserAISettingsResponse, Error, GetUserAISettingsResponse, typeof SETTINGS_QUERY_KEYS.USER_AI_SETTINGS>({
        queryKey: SETTINGS_QUERY_KEYS.USER_AI_SETTINGS,
        queryFn: fetchUserAiSettings,
        staleTime: 60 * 1000,
        ...options,
    });
};
