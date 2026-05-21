'use client';

import React from 'react';

import { useGetAccountsQuery } from '@modules/accounts/services/useAccountApi';
import SearchHeader from '@shared/components/inputs/SearchHeader';
import { UI_CONSTANTS } from '@shared/constants';
import { useAuthStore } from '@shared/store';
import CreateFolderModal from './CreateFolderModal';
import FoldersFilter from './FoldersFilter';

interface FolderHeaderProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filter: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onFilterChange: (filter: any) => void;
    searchText: string;
    setSearchText: (searchText: string) => void;
}

const FolderHeader: React.FC<FolderHeaderProps> = ({ filter, onFilterChange, searchText, setSearchText }) => {
    const { user } = useAuthStore();

    const { data: accounts } = useGetAccountsQuery(user?.id ?? '', { enabled: !!user?.id });

    return (
        <div className="mt-1 flex items-center justify-center gap-2 px-3">
            <FoldersFilter accounts={accounts || []} filter={filter} onFilterChange={onFilterChange} />
            <SearchHeader value={searchText} onChange={setSearchText} placeholder={UI_CONSTANTS.PLACEHOLDERS.SEARCH_FOLDERS} />
            {/* <Button className="cursor-pointer px-6">Create</Button> */}
            <CreateFolderModal accounts={accounts || []} />
        </div>
    );
};

export default FolderHeader;
