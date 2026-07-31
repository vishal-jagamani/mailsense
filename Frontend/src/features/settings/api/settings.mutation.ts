import { APIResponse, ProfileSettingsDataObject, UpdateAPIResponse, UpdateUserProfileSettingsResponse, UserSettings } from '@mailsense/types';
import { QUERY_KEYS } from '@shared/api';
import {} from '@shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { changeUserPassword, updateUserProfileSettings, updateUserSettings } from './settings.api';
import { toast } from 'sonner';

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

export const useUpdateUserSettingsMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: Partial<UserSettings>) => updateUserSettings(payload),
        onSuccess: () => {
            toast.success('Sync settings updated successfully');
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_SYNC_SETTINGS] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNTS] });
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update sync settings');
        },
    });
};
