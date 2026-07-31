import { APIResponse, ProfileSettingsDataObject, UpdateAPIResponse, UpdateUserProfileSettingsResponse, UserSettings } from '@mailsense/types';
import { axiosClient } from '@shared/api';
import { SETTINGS_API_ENDPOINTS } from '../../../shared/api/endpoints';

export async function getUserProfileSettings() {
    const { data } = await axiosClient.get<APIResponse<ProfileSettingsDataObject>>(`/users/profile`);
    return data;
}

export async function updateUserProfileSettings(data: ProfileSettingsDataObject) {
    const { data: response } = await axiosClient.put<APIResponse<UpdateUserProfileSettingsResponse>>(`/users/profile`, data);
    return response;
}

export async function changeUserPassword(data: { password: string }) {
    const { data: response } = await axiosClient.patch<UpdateAPIResponse>(`/users/change-password`, data);
    return response;
}

export const getUserSettings = async (): Promise<UserSettings> => {
    const response = await axiosClient.get<APIResponse<UserSettings>>(SETTINGS_API_ENDPOINTS.USER_SETTINGS);
    return response.data.data;
};

export const updateUserSettings = async (payload: Partial<UserSettings>): Promise<UserSettings> => {
    const response = await axiosClient.patch<APIResponse<UserSettings>>(SETTINGS_API_ENDPOINTS.USER_SETTINGS, payload);
    return response.data.data;
};
