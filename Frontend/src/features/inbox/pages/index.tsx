'use client';

import React, { Suspense } from 'react';
import { RefreshCw } from 'lucide-react';

import APILoader from '@shared/components/apiLoader';
import Loader from '@shared/components/loader';
import PaginationComponent from '@shared/components/table/Pagination';
import { useIsMobile } from '@shared/hooks';
import EmailListHeader from '../components/EmailListHeader';
import EmailListTable from '../components/EmailListTable';
import { useInboxPage } from '../hooks';

const InboxPage: React.FC = () => {
    const isMobile = useIsMobile();

    const {
        emails: { data: emailsData, fetchEmailsData, isLoadingEmails },
        emailFilterOptions: { data: emailFilterOptions, isLoading: isLoadingEmailFilters },
        actions: { handleEmailSelect, handlePageSizeChange, handleResetPage, handleResetSelection },
        states: { selectedEmails, page, pageSize, searchValue, filter, isSyncingInProgress },
        setters: { setPage, setSearchValue, setFilter },
    } = useInboxPage();

    return (
        <>
            <div className="flex items-center justify-center gap-4 px-4 py-2">
                <div className="flex h-full w-full flex-col items-center justify-center gap-4">
                    <APILoader show={isLoadingEmails || isLoadingEmailFilters} />
                    <EmailListHeader
                        searchValue={searchValue}
                        setSearchValue={setSearchValue}
                        filter={filter}
                        setFilter={setFilter}
                        selectedEmails={selectedEmails}
                        allEmails={emailsData?.data || []}
                        handleResetSelection={handleResetSelection}
                        handleResetPage={handleResetPage}
                        emailFilterOptions={emailFilterOptions || []}
                        fetchEmailsData={fetchEmailsData}
                    />

                    {/* Active Background Sync Banner */}
                    {isSyncingInProgress && (
                        <div className="flex w-full items-center justify-between rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-xs font-medium text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                            <div className="flex items-center gap-2">
                                <RefreshCw className="size-3.5 animate-spin" />
                                <span>Background sync in progress... new emails will load automatically.</span>
                            </div>
                        </div>
                    )}

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
        </>
    );
};

const InboxPageWrapper = () => (
    <Suspense fallback={<Loader />}>
        <InboxPage />
    </Suspense>
);

export default InboxPageWrapper;
