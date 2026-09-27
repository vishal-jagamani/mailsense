'use client';

import React, { Suspense } from 'react';

import KeyboardShortcutsModal from '@features/emails/components/KeyboardShortcutsModal';
import DeleteModal from '@features/emails/components/DeleteModal';
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
        states: { page, pageSize, searchValue, filter, selectedEmails, focusedIndex, isShortcutsModalOpen, emailsToDelete },
        setters: { setPage, setSearchValue, setFilter, setIsShortcutsModalOpen, setEmailsToDelete },
        actions: { handlePageSizeChange, handleEmailSelect, handleResetSelection, handleResetPage, handleConfirmDelete },
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
                    allEmails={emailsData?.data || []}
                    handleResetSelection={handleResetSelection}
                    handleResetPage={handleResetPage}
                    fetchEmailsData={fetchEmailsData}
                    onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
                />
                <div className={`flex w-full flex-col ${isMobile ? 'h-[calc(100vh-220px)]' : 'h-[calc(100vh-150px)]'}`}>
                    <EmailListTable
                        data={emailsData?.data || []}
                        page={page}
                        selectedEmails={selectedEmails}
                        focusedIndex={focusedIndex}
                        onEmailSelect={handleEmailSelect}
                        onDeleteSuccess={fetchEmailsData}
                        onDeleteRequest={(email) => setEmailsToDelete([email._id])}
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
            <KeyboardShortcutsModal isOpen={isShortcutsModalOpen} onClose={() => setIsShortcutsModalOpen(false)} />
            <DeleteModal
                open={emailsToDelete.length > 0}
                onOpenChange={(open) => {
                    if (!open) setEmailsToDelete([]);
                }}
                onDelete={handleConfirmDelete}
                title={emailsToDelete.length > 1 ? 'Delete Emails' : 'Delete Email'}
                description={
                    emailsToDelete.length > 1
                        ? `Are you sure you want to delete ${emailsToDelete.length} emails?`
                        : 'Are you sure you want to delete this email?'
                }
            />
        </div>
    );
};

const FolderEmailListWrapper: React.FC<FolderEmailListProps> = (props) => (
    <Suspense fallback={<Loader />}>
        <FolderEmailList {...props} />
    </Suspense>
);

export default FolderEmailListWrapper;
