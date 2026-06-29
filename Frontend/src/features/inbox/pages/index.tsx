'use client';

import React, { Suspense } from 'react';

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
        states: { selectedEmails, page, pageSize, searchValue, filter },
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
                        handleResetSelection={handleResetSelection}
                        handleResetPage={handleResetPage}
                        emailFilterOptions={emailFilterOptions || []}
                        fetchEmailsData={fetchEmailsData}
                    />
                    <div className={`flex w-full flex-col ${isMobile ? 'h-[calc(100vh-220px)]' : 'h-[calc(100vh-150px)]'}`}>
                        <EmailListTable data={emailsData?.data || []} page={page} selectedEmails={selectedEmails} onEmailSelect={handleEmailSelect} />
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
