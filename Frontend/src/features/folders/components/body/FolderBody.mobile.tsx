'use client';

import React from 'react';

import { FolderBodyProps } from '@entities/folder';
import PaginationComponent from '@shared/components/table/Pagination';
import FolderCard from './FolderCard';

const FolderBodyMobile: React.FC<FolderBodyProps> = ({ tableData, size, page, total, onPageChange, onPageSizeChange, renameState, deleteFolder }) => {
    return (
        <>
            <div className="mt-2 grid flex-1 grid-cols-1 content-start gap-4 overflow-y-auto">
                {tableData.map((folder, index) => (
                    <FolderCard key={index} data={folder} renameState={renameState} deleteFolder={deleteFolder} />
                ))}
            </div>
            <PaginationComponent pageSize={size} currentPage={page} total={total} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />
        </>
    );
};

export default FolderBodyMobile;
