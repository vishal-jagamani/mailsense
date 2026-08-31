'use client';

import { Search, Trash2 } from 'lucide-react';
import React from 'react';

import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { DraftListHeaderProps } from '../types';

export const DraftListHeader: React.FC<DraftListHeaderProps> = ({
    searchValue,
    setSearchValue,
    selectedDrafts,
    totalDrafts,
    handleBulkDelete,
    handleResetPage,
}) => {
    return (
        <div className="bg-secondary/40 flex w-full flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex flex-1 items-center">
                <Search className="text-muted-foreground absolute left-3 size-4" />
                <Input
                    placeholder="Search drafts by recipient, subject, or content..."
                    value={searchValue}
                    onChange={(e) => {
                        setSearchValue(e.target.value);
                        handleResetPage();
                    }}
                    className="pl-9 text-xs md:text-sm"
                />
            </div>

            <div className="flex items-center justify-between gap-3 md:justify-end">
                <span className="text-muted-foreground text-xs font-medium">
                    {totalDrafts} {totalDrafts === 1 ? 'draft' : 'drafts'}
                </span>

                {selectedDrafts.length > 0 && (
                    <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="flex items-center gap-1.5 text-xs">
                        <Trash2 className="size-3.5" />
                        Delete ({selectedDrafts.length})
                    </Button>
                )}
            </div>
        </div>
    );
};

export default DraftListHeader;
