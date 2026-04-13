'use client';

import React, { useState } from 'react';
import FoldersFilter from './FoldersFilter';
import SearchHeader from '@/shared/components/inputs/SearchHeader';
import { UseDebounceQuery } from '@/shared/hooks/useDebounceQuery';
import { UI_CONSTANTS } from '@/shared/constants/ui';
import { useGetAccountsQuery } from '@/modules/accounts/services/useAccountApi';
import { useAuthStore } from '@/store';
import { Button } from '@/shared/ui/button';
import CreateFolderModal from './CreateFolderModal';

interface FolderHeaderProps {
    filter: any;
    onFilterChange: (filter: any) => void;
    searchText: string;
    setSearchText: (searchText: string) => void;
}

const FolderHeader: React.FC<FolderHeaderProps> = ({ filter, onFilterChange, searchText, setSearchText }) => {
    const { user } = useAuthStore();

    const {
        data: accounts,
        isLoading: accountsLoading,
        error: accountError,
    } = useGetAccountsQuery(user?.id ?? '', {
        enabled: !!user?.id,
    });

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
