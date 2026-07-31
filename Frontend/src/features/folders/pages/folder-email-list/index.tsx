'use client';

import React, { Suspense } from 'react';

import FolderEmailListHeader from '@features/folders/components/folder-email-list-header';
import { useFolderEmailListPage } from '@features/folders/hooks';
import EmailListTable from '@features/inbox/components/EmailListTable';
import APILoader from '@shared/components/apiLoader';
import Loader from '@shared/components/loader';
import PaginationComponent from '@shared/components/table/Pagination';
import { useIsMobile } from '@shared/hooks';

interface FolderEmailListProps {
    folderId: string;
}

const FolderEmailList: React.FC<FolderEmailListProps> = ({ folderId }) => {
    const isMobile = useIsMobile();

    const {
        emails: { data: emailsData, fetch: fetchEmailsData, isLoading: isLoadingEmails },
        accounts: { data: accounts, isLoading: accountsLoading },
        states: { page, pageSize, searchValue, filter, selectedEmails },
        setters: { setPage, setSearchValue, setFilter },
        actions: { handlePageSizeChange, handleEmailSelect, handleResetSelection, handleResetPage },
    } = useFolderEmailListPage(folderId);

    return (
        <div className="flex items-center justify-center gap-4 px-4 py-2">
            <div className="flex h-full w-full flex-col items-center justify-center gap-4">
                <APILoader show={isLoadingEmails || accountsLoading} />
                <FolderEmailListHeader
                    searchValue={searchValue}
                    setSearchValue={setSearchValue}
                    accounts={accounts || []}
                    filter={filter}
                    setFilter={setFilter}
                    selectedEmails={selectedEmails}
                    handleResetSelection={handleResetSelection}
                    handleResetPage={handleResetPage}
                    fetchEmailsData={fetchEmailsData}
                />
                <div className={`flex w-full flex-col ${isMobile ? 'h-[calc(100vh-220px)]' : 'h-[calc(100vh-150px)]'}`}>
                    <EmailListTable
                        data={emailsData?.data || []}
                        page={page}
                        selectedEmails={selectedEmails}
                        onEmailSelect={handleEmailSelect}
                        onDeleteSuccess={fetchEmailsData}
                    />
                </div>
                <PaginationComponent
                    total={emailsData?.total || 0}
                    currentPage={page}
                    onPageChange={setPage}
                    onPageSizeChange={handlePageSizeChange}
                    pageSize={pageSize}
                />
            </div>
        </div>
    );
};

const FolderEmailListWrapper: React.FC<FolderEmailListProps> = (props) => (
    <Suspense fallback={<Loader />}>
        <FolderEmailList {...props} />
    </Suspense>
);

export default FolderEmailListWrapper;
