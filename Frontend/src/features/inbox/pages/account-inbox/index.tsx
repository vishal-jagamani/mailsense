'use client';

import React, { Suspense } from 'react';

import EmailListTable from '@features/inbox/components/EmailListTable';
import EmailMenuBarOptions from '@features/inbox/components/EmailMenuBarOptions';
import { useInboxPage } from '@features/inbox/hooks';
import APILoader from '@shared/components/apiLoader';
import SearchHeader from '@shared/components/inputs/SearchHeader';
import Loader from '@shared/components/loader';
import PaginationComponent from '@shared/components/table/Pagination';
import FilterModal from '@shared/components/utils/FilterModal';
import { DATE_RANGE_DROPDOWN_OPTIONS, UI_CONSTANTS } from '@shared/constants';
import { useIsMobile } from '@shared/hooks';
import { Filter, FilterOption, FilterOptionType } from '@shared/types';

const AccountInboxPage: React.FC<{ account: string }> = ({ account }) => {
    const isMobile = useIsMobile();

    const {
        emails: { data: emailsData, fetchEmailsData, isLoadingEmails },
        actions: { handleEmailSelect, handlePageSizeChange, handleResetPage, handleResetSelection },
        states: { selectedEmails, page, pageSize, searchValue, filter },
        setters: { setPage, setSearchValue, setFilter },
    } = useInboxPage(account);

    const filterOptions: FilterOption[] = [
        {
            id: 1,
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
                    <APILoader show={isLoadingEmails} />
                    <div className="flex w-full gap-2">
                        <FilterModal filter={filter} onFilterChange={(value: Filter) => setFilter(value)} filterOptions={filterOptions} />
                        <SearchHeader value={searchValue} onChange={setSearchValue} placeholder={UI_CONSTANTS.PLACEHOLDERS.SEARCH_EMAILS} />
                        <EmailMenuBarOptions
                            emailIds={selectedEmails}
                            onRefetchEmails={fetchEmailsData}
                            onResetSelection={handleResetSelection}
                            onResetPage={handleResetPage}
                        />
                    </div>
                    <div></div>
                    <div className={`flex w-full flex-col ${isMobile ? 'h-[calc(100vh-200px)]' : 'h-[calc(100vh-150px)]'}`}>
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

const AccountInboxPageWrapper: React.FC<{ account: string }> = ({ account }) => (
    <Suspense fallback={<Loader />}>
        <AccountInboxPage account={account} />
    </Suspense>
);

export default AccountInboxPageWrapper;
