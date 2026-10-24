import { CreateFolderBodyParams, FolderAttributes, GetAllFoldersRequestOptions, PaginatedDataResponse, UpdateAPIResponse } from '@mailsense/types';
import { axiosClient, FOLDER_API_ENDPOINTS } from '@shared/api';

export async function getAllFolders(body: GetAllFoldersRequestOptions) {
    const { data } = await axiosClient.post<PaginatedDataResponse<FolderAttributes>>(FOLDER_API_ENDPOINTS.GET_ALL_FOLDERS, body);
    return data;
}

export async function getFolderDetails(folderId: string): Promise<FolderAttributes> {
    const { data } = await axiosClient.get<FolderAttributes>(`${FOLDER_API_ENDPOINTS.FOLDERS}/${folderId}`);
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

export async function syncAccountFolders(accountId: string): Promise<UpdateAPIResponse> {
    const { data } = await axiosClient.get<UpdateAPIResponse>(`${FOLDER_API_ENDPOINTS.FOLDERS}/sync/${accountId}`);
    return data;
}
