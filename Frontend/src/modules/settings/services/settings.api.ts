import { axiosClient } from '@/shared/config/axios';
import { ProfileSettingsDataObject, UpdateUserProfileSettingsResponse } from '../settings.types';
import { APIResponse, UpdateAPIResponse } from '@/shared/types/api.types';

export async function getUserProfileSettings(userId: string) {
    const { data } = await axiosClient.get<APIResponse<ProfileSettingsDataObject>>(`/users/${userId}/profile`);
    return data;
}

export async function updateUserProfileSettings(userId: string, data: ProfileSettingsDataObject) {
    const { data: response } = await axiosClient.put<APIResponse<UpdateUserProfileSettingsResponse>>(`/users/${userId}/profile`, data);
    return response;
}

export async function changeUserPassword(userId: string, data: { password: string }) {
    const { data: response } = await axiosClient.patch<UpdateAPIResponse>(`/users/${userId}/change-password`, data);
    return response;
}
