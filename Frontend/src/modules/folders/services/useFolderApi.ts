import { FOLDER_KEYS } from '@shared/config/query-keys';
import { CreateFolderBodyParams, FolderAttributes, GetAllFoldersRequestOptions, PaginatedDataResponse, UpdateAPIResponse } from '@shared/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFolder, deleteFolder, getAllFolders, getFolderDetails, updateFolder } from './folder.api';

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

export const useCreateFolderMutation = () => {
    const queryClient = useQueryClient();
    return useMutation<UpdateAPIResponse, Error, CreateFolderBodyParams>({
        mutationFn: (body) => createFolder(body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [FOLDER_KEYS.FOLDERS] });
        },
    });
};

export const useUpdateFolderMutation = () => {
    const queryClient = useQueryClient();
    return useMutation<UpdateAPIResponse, Error, { id: string; body: CreateFolderBodyParams }>({
        mutationFn: ({ id, body }) => updateFolder(id, body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [FOLDER_KEYS.FOLDERS] });
        },
    });
};

export const useDeleteFolderMutation = () => {
    const queryClient = useQueryClient();
    return useMutation<UpdateAPIResponse, Error, string>({
        mutationFn: (id) => deleteFolder(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [FOLDER_KEYS.FOLDERS] });
        },
    });
};
