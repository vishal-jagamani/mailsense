'use client';

import React, { useEffect, useState } from 'react';

import APILoader from '@shared/components/apiLoader';
import PaginationComponent from '@shared/components/table/Pagination';
import { MESSAGES, UI_CONSTANTS } from '@shared/constants';
import { useIsMobile } from '@shared/hooks';
import { CreateFolderBodyParams, FolderAttributes } from '@shared/types';
import { toast } from 'sonner';
import { useDeleteFolderMutation, useUpdateFolderMutation } from '../../services/useFolderApi';
import FolderCard from './FolderCard';

interface FolderBodyProps {
    tableData: FolderAttributes[];
    size: number;
    page: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}

const FolderBody: React.FC<FolderBodyProps> = ({ tableData, size, page, total, onPageChange, onPageSizeChange }) => {
    const isMobile = useIsMobile();

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

    return (
        <div className={`flex w-full flex-col gap-5 px-3 ${isMobile ? 'h-[calc(100vh-80px)]' : 'h-[calc(100vh-90px)]'}`}>
            <div className="mt-2 grid flex-1 grid-cols-1 content-start gap-4 overflow-y-auto sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                <APILoader show={updateFolderLoading || deleteFolderLoading} size="small" />
                {tableData.map((folder, index) => (
                    <FolderCard
                        key={index}
                        data={folder}
                        renameState={{
                            renameFolderFlag,
                            renameFolderId,
                            renameFolderValue,
                            setRenameFolderFlag,
                            setRenameFolderId,
                            setRenameFolderValue,
                            handleUpdateFolder,
                        }}
                        deleteFolder={deleteFolder}
                    />
                ))}
            </div>
            <PaginationComponent pageSize={size} currentPage={page} total={total} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />
        </div>
    );
};

export default FolderBody;
