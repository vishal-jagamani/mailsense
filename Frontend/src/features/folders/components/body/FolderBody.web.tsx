'use client';

import React from 'react';

import { FolderBodyViewProps } from '@features/folders/types/folders-components.types';
import PaginationComponent from '@shared/components/table/Pagination';
import FolderCard from './FolderCard';

const FolderBodyWeb: React.FC<FolderBodyViewProps> = ({
    tableData,
    size,
    page,
    total,
    onPageChange,
    onPageSizeChange,
    renameState,
    deleteFolder,
}) => {
    return (
        <>
            <div className="mt-2 grid flex-1 grid-cols-2 content-start gap-4 overflow-y-auto md:grid-cols-3 lg:grid-cols-4">
                {tableData.map((folder, index) => (
                    <FolderCard key={index} data={folder} renameState={renameState} deleteFolder={deleteFolder} />
                ))}
            </div>
            <PaginationComponent pageSize={size} currentPage={page} total={total} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />
        </>
    );
};

export default FolderBodyWeb;
