'use client';

import React from 'react';

import { AccountAttributes } from '@entities/account';
import EmailMenuBarOptions from '@features/inbox/components/EmailMenuBarOptions';
import SearchHeader from '@shared/components/inputs/SearchHeader';
import FilterModal from '@shared/components/utils/FilterModal';
import { DATE_RANGE_DROPDOWN_OPTIONS, UI_CONSTANTS } from '@shared/constants';
import { useIsMobile } from '@shared/hooks';
import { Filter, FilterOption, FilterOptionType } from '@shared/types';

interface FolderEmailListHeaderProps {
    searchValue: string;
    setSearchValue: (value: string) => void;
    accounts: AccountAttributes[];
    filter: Filter | null;
    setFilter: (value: Filter) => void;
    selectedEmails: string[];
    handleResetSelection: () => void;
    handleResetPage: () => void;
    fetchEmailsData: () => void;
}

const FolderEmailListHeader: React.FC<FolderEmailListHeaderProps> = (props) => {
    const { searchValue, setSearchValue, accounts, filter, setFilter, selectedEmails, handleResetSelection, handleResetPage, fetchEmailsData } =
        props;
    const isMobile = useIsMobile();

    const filterOptions: FilterOption[] = [
        {
            id: 1,
            name: 'accountId',
            type: FilterOptionType.DROPDOWN,
            label: 'Accounts',
            data:
                accounts?.map((account) => {
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
            {isMobile ? (
                <div className="flex w-full flex-col items-center gap-2">
                    <div className="w-full">
                        <SearchHeader value={searchValue} onChange={setSearchValue} placeholder={UI_CONSTANTS.PLACEHOLDERS.SEARCH_EMAILS} />
                    </div>
                    <div className="flex w-full justify-between">
                        <FilterModal filter={filter} onFilterChange={(value: Filter) => setFilter(value)} filterOptions={filterOptions} />
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
                    <FilterModal filter={filter} onFilterChange={(value: Filter) => setFilter(value)} filterOptions={filterOptions} />
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

export default FolderEmailListHeader;
