import { APIResponse, ProfileSettingsDataObject } from '@mailsense/types';
import { QUERY_KEYS } from '@shared/api';
import { useQuery } from '@tanstack/react-query';
import { getUserProfileSettings } from './settings.api';

export const useGetProfileQuery = (enabled: boolean) => {
    return useQuery<APIResponse<ProfileSettingsDataObject>>({
        queryKey: [QUERY_KEYS.USER_PROFILE_SETTINGS],
        queryFn: () => getUserProfileSettings(),
        enabled,
    });
};
