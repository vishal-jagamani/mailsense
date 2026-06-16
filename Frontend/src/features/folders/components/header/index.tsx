'use client';

import React from 'react';

import { useGetAccountsQuery } from '@features/accounts/api/accounts.queries';
import SearchHeader from '@shared/components/inputs/SearchHeader';
import FilterModal from '@shared/components/utils/FilterModal';
import { DATE_RANGE_DROPDOWN_OPTIONS, UI_CONSTANTS } from '@shared/constants';
import { useAuthStore } from '@shared/store';
import { Filter, FilterOption, FilterOptionType } from '@shared/types';
import CreateFolderModal from './CreateFolderModal';

interface FolderHeaderProps {
    filter: Filter | null;
    onFilterChange: (filter: Filter) => void;
    searchText: string;
    setSearchText: (searchText: string) => void;
}

const FolderHeader: React.FC<FolderHeaderProps> = ({ filter, onFilterChange, searchText, setSearchText }) => {
    const { user } = useAuthStore();

    const { data: accounts } = useGetAccountsQuery(user?.id ?? '', { enabled: !!user?.id });

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
        <div className="mt-1 flex items-center justify-center gap-2 px-3">
            <FilterModal filter={filter} onFilterChange={onFilterChange} filterOptions={filterOptions} />
            <SearchHeader value={searchText} onChange={setSearchText} placeholder={UI_CONSTANTS.PLACEHOLDERS.SEARCH_FOLDERS} />
            <CreateFolderModal accounts={accounts || []} />
        </div>
    );
};

export default FolderHeader;
