'use client';

import React from 'react';

import { useIsMobile } from '@shared/hooks';
import { Checkbox } from '@shared/ui/checkbox';
import { Table, TableHead, TableHeader, TableRow } from '@shared/ui/table';
import { DraftListTableHeaderProps } from '../../types';

export const DraftListTableHeader: React.FC<DraftListTableHeaderProps> = ({ allSelected, handleSelectAll }) => {
    const isMobile = useIsMobile();

    return (
        <div className="bg-secondary sticky top-0 z-10 rounded-t-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-10">
                            <Checkbox
                                id="select-all-drafts"
                                aria-label="Select all drafts"
                                checked={allSelected}
                                onCheckedChange={() => handleSelectAll()}
                                className="cursor-pointer"
                            />
                        </TableHead>
                        {isMobile ? (
                            <>
                                <TableHead className="w-80">Draft Details</TableHead>
                                <TableHead className="w-16 whitespace-nowrap">Saved</TableHead>
                            </>
                        ) : (
                            <>
                                <TableHead className="w-56">To</TableHead>
                                <TableHead className="max-w-60">Subject & Content</TableHead>
                                <TableHead className="w-28 whitespace-nowrap">Last Saved</TableHead>
                            </>
                        )}
                        <TableHead className="w-12 whitespace-nowrap"></TableHead>
                    </TableRow>
                </TableHeader>
            </Table>
        </div>
    );
};

export default DraftListTableHeader;
