import { axiosClient } from '@shared/api';
import { APIResponse, ProfileSettingsDataObject, UpdateAPIResponse, UpdateUserProfileSettingsResponse } from '@shared/types';

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
