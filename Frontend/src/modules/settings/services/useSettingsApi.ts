import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProfileSettingsDataObject, UpdateUserProfileSettingsResponse } from '../settings.types';
import { changeUserPassword, getUserProfileSettings, updateUserProfileSettings } from './settings.api';
import { QUERY_KEYS } from '@/shared/config/query-keys';
import { APIResponse, UpdateAPIResponse } from '@/shared/types/api.types';

export const useGetUserProfileSettings = (userId: string, enabled: boolean) => {
    return useQuery<APIResponse<ProfileSettingsDataObject>>({
        queryKey: [QUERY_KEYS.USER_PROFILE_SETTINGS, userId],
        queryFn: () => getUserProfileSettings(userId),
        enabled,
    });
};

export const useUpdateUserProfileSettings = () => {
    const queryClient = useQueryClient();
    return useMutation<APIResponse<UpdateUserProfileSettingsResponse>, Error, { userId: string; data: ProfileSettingsDataObject }>({
        mutationFn: ({ userId, data }) => updateUserProfileSettings(userId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_PROFILE_SETTINGS] });
        },
    });
};

export const useChangeUserPassword = () => {
    const queryClient = useQueryClient();
    return useMutation<UpdateAPIResponse, Error, { userId: string; data: { password: string } }>({
        mutationFn: ({ userId, data }) => changeUserPassword(userId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_PROFILE_SETTINGS] });
        },
    });
};
