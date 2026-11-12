import { APIResponse, ProfileSettingsDataObject, UserSettings } from '@mailsense/types';
import { QUERY_KEYS } from '@shared/api';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { UseGetUseSettingsQueryOptions } from '../types/settings-api.types';
import { getUserProfileSettings, getUserSettings } from './settings.api';

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
