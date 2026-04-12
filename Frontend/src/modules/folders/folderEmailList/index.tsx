'use client';

import { useBreadcrumbStore } from '@shared/store/breadcrumb.store';
import React, { useEffect } from 'react';

interface FolderEmailListProps {
    folderId: string;
}

const FolderEmailList: React.FC<FolderEmailListProps> = ({ folderId }) => {
    useEffect(() => {
        useBreadcrumbStore.setState({
            items: [
                { title: 'Folders', url: '/folders' },
                { title: folderId, url: `/folders/${folderId}` },
            ],
        });
    }, [folderId]);

    return <div>FolderEmailList</div>;
};

export default FolderEmailList;
