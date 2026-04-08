import { axiosClient } from '@/shared/config/axios';
import { GetALlFolderResponse, GetAllFoldersRequestOptions } from '@/shared/types/folder.types';
import { FOLDER_API_ENDPOINTS } from '../constants/api.constants';

export async function getAllFolders(body: GetAllFoldersRequestOptions) {
    const { data } = await axiosClient.post<GetALlFolderResponse>(FOLDER_API_ENDPOINTS.GET_ALL_FOLDERS, body);
    return data;
}
