import { CreateFolderBodyParams, UpdateAPIResponse } from '@mailsense/types';
import { FOLDER_KEYS } from '@shared/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UpdateFolderMutationVariables } from '../types/folders.types';
import { createFolder, deleteFolder, updateFolder } from './folder.api';

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
    return useMutation<UpdateAPIResponse, Error, UpdateFolderMutationVariables>({
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
