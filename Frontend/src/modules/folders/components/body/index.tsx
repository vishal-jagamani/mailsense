'use client';

import React from 'react';

import { useIsMobile } from '@/hooks/use-mobile';
import PaginationComponent from '@/shared/components/table/Pagination';
import { FolderAttributes } from '@/shared/types/folder.types';
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

    return (
        <div className={`flex w-full flex-col gap-5 px-3 ${isMobile ? 'h-[calc(100vh-220px)]' : 'h-[calc(100vh-90px)]'}`}>
            <div className="mt-2 grid flex-1 grid-cols-1 content-start gap-4 overflow-y-auto sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {tableData.map((folder, index) => (
                    <FolderCard key={index} data={folder} />
                ))}
            </div>
            <PaginationComponent pageSize={size} currentPage={page} total={total} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />
        </div>
    );
};

export default FolderBody;
