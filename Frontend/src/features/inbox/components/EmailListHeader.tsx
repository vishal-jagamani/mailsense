'use client';

import React from 'react';

import SearchHeader from '@shared/components/inputs/SearchHeader';
import FilterModal from '@shared/components/utils/FilterModal';
import { UI_CONSTANTS } from '@shared/constants';
import { useIsMobile } from '@shared/hooks';
import { Filter, FilterOption } from '@shared/types';
import EmailMenuBarOptions from './EmailMenuBarOptions';

interface EmailListHeaderProps {
    searchValue: string;
    setSearchValue: (value: string) => void;
    filter: Filter | null;
    setFilter: (value: Filter) => void;
    selectedEmails: string[];
    handleResetSelection: () => void;
    handleResetPage: () => void;
    emailFilterOptions: FilterOption[];
    fetchEmailsData: () => void;
}

const EmailListHeader: React.FC<EmailListHeaderProps> = (props) => {
    const {
        searchValue,
        setSearchValue,
        filter,
        setFilter,
        selectedEmails,
        handleResetSelection,
        handleResetPage,
        emailFilterOptions,
        fetchEmailsData,
    } = props;
    const isMobile = useIsMobile();

    return (
        <>
            {isMobile ? (
                <div className="flex w-full flex-col items-center gap-2">
                    <div className="w-full">
                        <SearchHeader value={searchValue} onChange={setSearchValue} placeholder={UI_CONSTANTS.PLACEHOLDERS.SEARCH_EMAILS} />
                    </div>
                    <div className="flex w-full justify-between">
                        <FilterModal filter={filter} onFilterChange={(value) => setFilter(value)} filterOptions={emailFilterOptions || []} />
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
                    <FilterModal filter={filter} onFilterChange={(value) => setFilter(value)} filterOptions={emailFilterOptions || []} />
                    <SearchHeader value={searchValue} onChange={setSearchValue} placeholder={UI_CONSTANTS.PLACEHOLDERS.SEARCH_EMAILS} />
                    <EmailMenuBarOptions
                        emailIds={selectedEmails}
                        onRefetchEmails={fetchEmailsData}
                        onResetSelection={handleResetSelection}
                        onResetPage={handleResetPage}
                    />
                </div>
            )}
        </>
    );
};

export default EmailListHeader;
