'use client';

import React, { Suspense } from 'react';

import { GetAllEmailsFilters } from '@entities/email';
import APILoader from '@shared/components/apiLoader';
import SearchHeader from '@shared/components/inputs/SearchHeader';
import Loader from '@shared/components/loader';
import PaginationComponent from '@shared/components/table/Pagination';
import { UI_CONSTANTS } from '@shared/constants';
import { useIsMobile } from '@shared/hooks';
import EmailListTable from '../components/EmailListTable';
import { useInboxPage } from '../hooks';
import EmailListFilter from '../components/EmailListFilter';
import EmailMenuBarOptions from '../components/EmailMenuBarOptions';

const InboxPage: React.FC = () => {
    const isMobile = useIsMobile();

    const {
        accounts: { data: accountsData, accountsDataLoading },
        emails: { data: emailsData, fetchEmailsData, isLoadingEmails },
        actions: { handleEmailSelect, handlePageSizeChange, handleResetPage, handleResetSelection },
        states: { selectedEmails, page, pageSize, searchValue, getAllEmailsFilters },
        setters: { setGetAllEmailsFilters, setPage, setSearchValue },
    } = useInboxPage();

    return (
        <>
            <div className="flex items-center justify-center gap-4 px-4 py-2">
                <div className="flex h-full w-full flex-col items-center justify-center gap-4">
                    <APILoader show={isLoadingEmails || accountsDataLoading} />
                    {isMobile ? (
                        <div className="flex w-full flex-col items-center gap-2">
                            <div className="w-full">
                                <SearchHeader value={searchValue} onChange={setSearchValue} placeholder={UI_CONSTANTS.PLACEHOLDERS.SEARCH_EMAILS} />
                            </div>
                            <div className="flex w-full justify-between">
                                <EmailListFilter
                                    accounts={accountsData || []}
                                    filter={getAllEmailsFilters}
                                    onFilterChange={(value: GetAllEmailsFilters) => setGetAllEmailsFilters(value)}
                                />
                                <EmailMenuBarOptions
                                    emailIds={selectedEmails}
                                    onResetSelection={handleResetSelection}
                                    onResetPage={handleResetPage}
                                    onRefetchEmails={fetchEmailsData}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex w-full items-center gap-2">
                            <EmailListFilter
                                accounts={accountsData || []}
                                filter={getAllEmailsFilters}
                                onFilterChange={(value: GetAllEmailsFilters) => setGetAllEmailsFilters(value)}
                            />
                            <SearchHeader value={searchValue} onChange={setSearchValue} placeholder={UI_CONSTANTS.PLACEHOLDERS.SEARCH_EMAILS} />
                            <EmailMenuBarOptions
                                emailIds={selectedEmails}
                                onRefetchEmails={fetchEmailsData}
                                onResetSelection={handleResetSelection}
                                onResetPage={handleResetPage}
                            />
                        </div>
                    )}
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
