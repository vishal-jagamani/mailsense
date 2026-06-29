import { FolderAttributes, GetAllFoldersRequestOptions } from '@entities/folder';
import { FOLDER_KEYS } from '@shared/api';
import { PaginatedDataResponse } from '@shared/types';
import { useQuery } from '@tanstack/react-query';
import { getAllFolders, getFolderDetails } from './folder.api';

export const useGetAllFolders = (options: GetAllFoldersRequestOptions | null) => {
    return useQuery<PaginatedDataResponse<FolderAttributes>, Error>({
        queryKey: [FOLDER_KEYS.FOLDERS, options?.page, options?.size, options?.filters],
        queryFn: () => getAllFolders(options!),
        enabled: !!options?.userId,
    });
};

export const useGetFolderQuery = (id: string) => {
    return useQuery<FolderAttributes, Error>({
        queryKey: [FOLDER_KEYS.FOLDERS, id],
        queryFn: () => getFolderDetails(id),
        enabled: !!id,
    });
};
