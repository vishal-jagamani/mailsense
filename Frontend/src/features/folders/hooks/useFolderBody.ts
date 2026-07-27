import { toast } from 'sonner';

import { RenameFolderState } from '@entities/folder';
import { CreateFolderBodyParams } from '@mailsense/types';
import { MESSAGES, UI_CONSTANTS } from '@shared/constants';
import { useEffect, useState } from 'react';
import { useDeleteFolderMutation, useUpdateFolderMutation } from '../api/folder.mutation';

export const useFolderBody = () => {
    const [renameFolderFlag, setRenameFolderFlag] = useState<boolean>(false);
    const [renameFolderId, setRenameFolderId] = useState<string>('');
    const [renameFolderValue, setRenameFolderValue] = useState<string>('');

    const { mutate: updateFolder, data: updateFolderData, isPending: updateFolderLoading, error: updateFolderError } = useUpdateFolderMutation();
    const { mutate: deleteFolder, data: deleteFolderData, isPending: deleteFolderLoading, isError: deleteFolderError } = useDeleteFolderMutation();

    useEffect(() => {
        if (updateFolderData) {
            toast.success(MESSAGES.FOLDERS.UPDATE_FOLDER_SUCCESS, { duration: UI_CONSTANTS.TOAST.DURATION });
        }
        if (updateFolderError) {
            toast.error(MESSAGES.FOLDERS.UPDATE_FOLDER_ERROR, { duration: UI_CONSTANTS.TOAST.DURATION });
        }
        if (deleteFolderData) {
            toast.success(MESSAGES.FOLDERS.DELETE_FOLDER_SUCCESS, { duration: UI_CONSTANTS.TOAST.DURATION });
        }
        if (deleteFolderError) {
            toast.error(MESSAGES.FOLDERS.DELETE_FOLDER_ERROR, { duration: UI_CONSTANTS.TOAST.DURATION });
        }
    }, [updateFolderData, updateFolderError, deleteFolderData, deleteFolderError]);

    const handleUpdateFolder = (id: string, body: CreateFolderBodyParams) => {
        updateFolder({ id, body });
    };

    const renameState: RenameFolderState = {
        renameFolderFlag,
        renameFolderId,
        renameFolderValue,
        setRenameFolderFlag,
        setRenameFolderId,
        setRenameFolderValue,
        handleUpdateFolder,
    };

    return {
        updateFolder: { isLoading: updateFolderLoading },
        deleteFolder: { mutate: deleteFolder, isLoading: deleteFolderLoading },
        states: { renameState },
    };
};
