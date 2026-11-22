import {
    APIResponse,
    GetUserAISettingsResponse,
    ProfileSettingsDataObject,
    UpdateAPIResponse,
    UpdateUserAISettingsPayload,
    UpdateUserProfileSettingsResponse,
    UserSettings,
} from '@mailsense/types';
import { QUERY_KEYS, SETTINGS_QUERY_KEYS } from '@shared/api';
import {} from '@shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChangePasswordPayload } from '../types';
import { UseUpdateAiSettingsMutationOptions } from '../types/ai-settings.types';
import { changeUserPassword, updateUserAiSettings, updateUserProfileSettings, updateUserSettings } from './settings.api';

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
    return useMutation<UpdateAPIResponse, Error, ChangePasswordPayload>({
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

export const useUpdateAiSettingsMutation = (options?: Partial<UseUpdateAiSettingsMutationOptions>) => {
    const queryClient = useQueryClient();

    return useMutation<GetUserAISettingsResponse, Error, UpdateUserAISettingsPayload>({
        mutationFn: updateUserAiSettings,
        onSuccess: (data) => {
            queryClient.setQueryData(SETTINGS_QUERY_KEYS.USER_AI_SETTINGS, data);
            toast.success('AI settings updated successfully');
        },
        onError: () => {
            toast.error('Failed to update AI settings. Please try again.');
        },
        ...options,
    });
};
