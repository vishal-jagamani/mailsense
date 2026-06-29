'use client';

import React, { Suspense } from 'react';

import APILoader from '@shared/components/apiLoader';
import SearchHeader from '@shared/components/inputs/SearchHeader';
import Loader from '@shared/components/loader';
import PaginationComponent from '@shared/components/table/Pagination';
import FilterModal from '@shared/components/utils/FilterModal';
import { DATE_RANGE_DROPDOWN_OPTIONS, UI_CONSTANTS } from '@shared/constants';
import { useIsMobile } from '@shared/hooks';
import { FilterOption, FilterOptionType } from '@shared/types';
import EmailListTable from '../components/EmailListTable';
import EmailMenuBarOptions from '../components/EmailMenuBarOptions';
import { useInboxPage } from '../hooks';

const InboxPage: React.FC = () => {
    const isMobile = useIsMobile();

    const {
        accounts: { data: accountsData, accountsDataLoading },
        emails: { data: emailsData, fetchEmailsData, isLoadingEmails },
        actions: { handleEmailSelect, handlePageSizeChange, handleResetPage, handleResetSelection },
        states: { selectedEmails, page, pageSize, searchValue, filter },
        setters: { setPage, setSearchValue, setFilter },
    } = useInboxPage();

    const filterOptions: FilterOption[] = [
        {
            id: 1,
            name: 'accountId',
            type: FilterOptionType.DROPDOWN,
            label: 'Accounts',
            data:
                accountsData?.map((account) => {
                    return {
                        id: account._id,
                        name: account._id,
                        label: account.emailAddress,
                        provider: account.provider,
                        selectedValue: '',
                    };
                }) || [],
        },
        {
            id: 2,
            name: 'dateRange',
            label: 'Date Range',
            type: FilterOptionType.DROPDOWN,
            data: DATE_RANGE_DROPDOWN_OPTIONS.map((item) => {
                return {
                    id: item.name,
                    name: item.name,
                    label: item.label,
                    selectedValue: '',
                };
            }),
        },
    ];

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
                                <FilterModal filter={filter} onFilterChange={(value) => setFilter(value)} filterOptions={filterOptions} />
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
                            <FilterModal filter={filter} onFilterChange={(value) => setFilter(value)} filterOptions={filterOptions} />
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
