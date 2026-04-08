import { GetALlFolderResponse, GetAllFoldersRequestOptions } from '@/shared/types/folder.types';
import { useMutation } from '@tanstack/react-query';
import { getAllFolders } from './folder.api';

export const useGetAllFolders = () => {
    return useMutation<GetALlFolderResponse, Error, GetAllFoldersRequestOptions>({
        mutationFn: (options) => getAllFolders(options),
    });
};
