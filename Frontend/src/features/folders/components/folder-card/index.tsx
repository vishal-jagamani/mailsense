'use client';

import React from 'react';

import { CreateFolderBodyParams, FolderAttributes } from '@mailsense/types';
import FolderCardActions from './FolderCardActions';
import FolderCardHeader from './FolderCardHeader';
import FolderCardInfo from './FolderCardInfo';

interface RenameFolderState {
    renameFolderFlag: boolean;
    renameFolderId: string;
    renameFolderValue: string;
    setRenameFolderFlag: (value: boolean) => void;
    setRenameFolderId: (id: string) => void;
    setRenameFolderValue: (value: string) => void;
    handleUpdateFolder: (id: string, body: CreateFolderBodyParams) => void;
}

interface FolderCardProps {
    data: FolderAttributes;
    renameState: RenameFolderState;
    deleteFolder: (id: string) => void;
}

const FolderCard: React.FC<FolderCardProps> = ({ data, renameState, deleteFolder }) => {
    return (
        <div className="dark:bg-card bg-secondary flex h-fit flex-col gap-1 rounded-xl border p-2 select-none">
            <FolderCardHeader data={data} renameState={renameState} />
            <FolderCardInfo data={data} />
            <FolderCardActions data={data} renameState={renameState} deleteFolder={deleteFolder} />
        </div>
    );
};

export default FolderCard;
