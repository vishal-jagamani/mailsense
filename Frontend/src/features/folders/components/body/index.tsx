'use client';

import React from 'react';

import { useFolderBody } from '@features/folders/hooks';
import { FolderBodyProps } from '@features/folders/types/folders-components.types';
import APILoader from '@shared/components/apiLoader';
import { useIsMobile } from '@shared/hooks';
import dynamic from 'next/dynamic';

const FolderBodyDesktop = dynamic(() => import('./FolderBody.web'));
const FolderBodyMobile = dynamic(() => import('./FolderBody.mobile'));

const FolderBody: React.FC<FolderBodyProps> = (props) => {
    const isMobile = useIsMobile();

    const {
        updateFolder: { isLoading: updateFolderLoading },
        deleteFolder: { mutate: deleteFolderMutation, isLoading: deleteFolderLoading },
        states: { renameState },
    } = useFolderBody();

    return (
        <div className={`flex w-full flex-col gap-5 px-3 ${isMobile ? 'h-[calc(100vh-80px)]' : 'h-[calc(100vh-90px)]'}`}>
            <APILoader show={updateFolderLoading || deleteFolderLoading} size="small" />
            {isMobile ? (
                <FolderBodyMobile {...props} renameState={renameState} deleteFolder={deleteFolderMutation} />
            ) : (
                <FolderBodyDesktop {...props} renameState={renameState} deleteFolder={deleteFolderMutation} />
            )}
        </div>
    );
};

export default FolderBody;
