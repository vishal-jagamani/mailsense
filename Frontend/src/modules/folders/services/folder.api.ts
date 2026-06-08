import { axiosClient } from '@shared/api';
import { CreateFolderBodyParams, FolderAttributes, GetAllFoldersRequestOptions, PaginatedDataResponse } from '@shared/types';
import { FOLDER_API_ENDPOINTS } from '../constants/api.constants';

export async function getAllFolders(body: GetAllFoldersRequestOptions) {
    const { data } = await axiosClient.post<PaginatedDataResponse<FolderAttributes>>(FOLDER_API_ENDPOINTS.GET_ALL_FOLDERS, body);
    return data;
}

export async function getFolderDetails(id: string) {
    const { data } = await axiosClient.get(`${FOLDER_API_ENDPOINTS.FOLDERS}/${id}`);
    return data;
}

export async function createFolder(body: CreateFolderBodyParams) {
    const { data } = await axiosClient.post(FOLDER_API_ENDPOINTS.FOLDERS, body);
    return data;
}

export async function updateFolder(id: string, body: CreateFolderBodyParams) {
    const { data } = await axiosClient.patch(`${FOLDER_API_ENDPOINTS.FOLDERS}/${id}`, body);
    return data;
}

export async function deleteFolder(id: string) {
    const { data } = await axiosClient.delete(`${FOLDER_API_ENDPOINTS.FOLDERS}/${id}`);
    return data;
}
