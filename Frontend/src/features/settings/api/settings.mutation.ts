import { QUERY_KEYS } from '@shared/api';
import { APIResponse, ProfileSettingsDataObject, UpdateAPIResponse, UpdateUserProfileSettingsResponse } from '@shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { changeUserPassword, updateUserProfileSettings } from './settings.api';

export const useUpdateProfileMutation = () => {
    const queryClient = useQueryClient();
    return useMutation<APIResponse<UpdateUserProfileSettingsResponse>, Error, ProfileSettingsDataObject>({
        mutationFn: (data) => updateUserProfileSettings(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_PROFILE_SETTINGS] });
        },
    });
};

export const useChangePasswordMutation = () => {
    const queryClient = useQueryClient();
    return useMutation<UpdateAPIResponse, Error, { password: string }>({
        mutationFn: (data) => changeUserPassword(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_PROFILE_SETTINGS] });
        },
    });
};
