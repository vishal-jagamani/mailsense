'use client';

import React, { Suspense } from 'react';

import APILoader from '@shared/components/apiLoader';
import Loader from '@shared/components/loader';
import PaginationComponent from '@shared/components/table/Pagination';
import { useIsMobile } from '@shared/hooks';
import DraftListTable from '../components/draft-table';
import DraftListHeader from '../components/DraftListHeader';
import { useDraftsPage } from '../hooks/useDraftsPage';

const DraftsPage: React.FC = () => {
    const isMobile = useIsMobile();

    const {
        drafts: { data: draftsData, total, isLoading },
        actions: { handleDraftSelect, handlePageSizeChange, handleDeleteDraft, handleBulkDelete, handleOpenDraft },
        states: { selectedDrafts, page, pageSize, searchValue },
        setters: { setPage, setSearchValue },
    } = useDraftsPage();

    return (
        <div className="flex items-center justify-center gap-4 px-4 py-2">
            <div className="flex h-full w-full flex-col items-center justify-center gap-4">
                <APILoader show={isLoading} />

                <DraftListHeader
                    searchValue={searchValue}
                    setSearchValue={setSearchValue}
                    selectedDrafts={selectedDrafts}
                    totalDrafts={total}
                    handleBulkDelete={handleBulkDelete}
                    handleResetPage={() => setPage(1)}
                />

                <div className={`flex w-full flex-col ${isMobile ? 'h-[calc(100vh-220px)]' : 'h-[calc(100vh-160px)]'}`}>
                    <DraftListTable
                        data={draftsData}
                        selectedDrafts={selectedDrafts}
                        onDraftSelect={handleDraftSelect}
                        onDeleteDraft={handleDeleteDraft}
                        onOpenDraft={handleOpenDraft}
                    />
                </div>

                {total > 0 && (
                    <PaginationComponent
                        total={total}
                        currentPage={page}
                        onPageChange={setPage}
                        onPageSizeChange={handlePageSizeChange}
                        pageSize={pageSize}
                    />
                )}
            </div>
        </div>
    );
};

const DraftsPageWrapper: React.FC = () => (
    <Suspense fallback={<Loader />}>
        <DraftsPage />
    </Suspense>
);

export default DraftsPageWrapper;
