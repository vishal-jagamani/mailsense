'use client';

import dynamic from 'next/dynamic';
import React, { Suspense } from 'react';

import APILoader from '@shared/components/apiLoader';
import Loader from '@shared/components/loader';
import { useFoldersPage } from '../hooks';

const FolderHeader = dynamic(() => import('../components/header'));
const FolderBody = dynamic(() => import('../components/body'));

const FoldersPage: React.FC = () => {
    const {
        folders: { data: foldersData, isLoading: foldersLoading },
        states: { pageSize, searchText, currentPage },
        setters: { setPage, setFilter, setSearchText },
        actions: { handlePageSizeChange },
    } = useFoldersPage();

    return (
        <div className="flex flex-col gap-2">
            <APILoader show={foldersLoading} />
            <FolderHeader filter={null} onFilterChange={(filter) => setFilter(filter)} searchText={searchText} setSearchText={setSearchText} />
            <FolderBody
                tableData={foldersData?.data || []}
                size={pageSize}
                page={currentPage}
                total={foldersData?.total || 0}
                onPageChange={(page) => setPage(page)}
                onPageSizeChange={handlePageSizeChange}
            />
        </div>
    );
};

const FoldersPageWrapper = () => (
    <Suspense fallback={<Loader />}>
        <FoldersPage />
    </Suspense>
);

export default FoldersPageWrapper;
