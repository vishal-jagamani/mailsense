'use client';

import React from 'react';

import { FolderCardProps } from '../../types/folders.types';
import FolderCardActions from './FolderCardActions';
import FolderCardHeader from './FolderCardHeader';
import FolderCardInfo from './FolderCardInfo';

export const FolderCard: React.FC<FolderCardProps> = ({ data, renameState, deleteFolder }) => {
    return (
        <div className="dark:bg-card bg-secondary flex h-fit flex-col gap-1 rounded-xl border p-2 select-none">
            <FolderCardHeader data={data} renameState={renameState} />
            <FolderCardInfo data={data} />
            <FolderCardActions data={data} renameState={renameState} deleteFolder={deleteFolder} />
        </div>
    );
};

export default FolderCard;
