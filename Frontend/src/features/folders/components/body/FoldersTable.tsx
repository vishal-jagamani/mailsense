'use client';

import { useRouter } from 'next/navigation';
import React from 'react';

import { Checkbox } from '@radix-ui/react-checkbox';
import { useIsMobile } from '@shared/hooks';
import { FolderAttributes } from '@shared/types';
import { Table, TableCell, TableHead, TableHeader, TableRow } from '@shared/ui/table';
import { Trash } from 'lucide-react';

interface FoldersTableProps {
    tableData: FolderAttributes[];
    page: number;
    selectedFolders?: string[];
    onFolderSelect?: (folderIds: string[]) => void;
}

const FoldersTable: React.FC<FoldersTableProps> = ({ tableData, page, selectedFolders, onFolderSelect }) => {
    const router = useRouter();
    const isMobile = useIsMobile();

    return (
        <div className="flex h-full w-full flex-col">
            {/* Fixed Header */}
            <div className="bg-secondary sticky top-0 z-10 rounded-t-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-10">
                                <Checkbox
                                    id="select-all"
                                    aria-label="Select all"
                                    onClick={() => {
                                        if ((selectedFolders || []).length === tableData.length) {
                                            onFolderSelect?.([]);
                                        } else {
                                            onFolderSelect?.(tableData.map((folder) => folder._id));
                                        }
                                    }}
                                    className="cursor-pointer"
                                />
                            </TableHead>
                            {isMobile ? (
                                <>
                                    <TableHead className="w-80">Name</TableHead>
                                    <TableHead className="w-12 whitespace-nowrap">Date</TableHead>
                                </>
                            ) : (
                                <>
                                    <TableHead className="w-56">Name</TableHead>
                                    {/* <TableHead className="max-w-60">Provider</TableHead> */}
                                    <TableHead className="max-w-60">No. of Emails</TableHead>
                                    <TableHead className="max-w-60">No. of Unread Emails</TableHead>
                                    <TableHead className="w-28 whitespace-nowrap">View Emails</TableHead>
                                </>
                            )}
                            <TableHead className="w-14 whitespace-nowrap"></TableHead>
                        </TableRow>
                    </TableHeader>
                </Table>
            </div>

            {/* Scrollable Body */}
            <div className="h-[calc(100vh-300px)] min-h-[400px] flex-1 overflow-y-auto">
                <Table>
                    <tbody>
                        {tableData.map((folder) => (
                            <TableRow
                                key={folder._id}
                                // className={`cursor-pointer ${selectedFolders?.includes(folder.providerFolderId) ? 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-800 dark:hover:bg-blue-800' : ''} ${!folder.isRead && selectedFolders?.includes(folder.providerFolderId) ? 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-800 dark:hover:bg-blue-800' : !folder.isRead ? 'bg-muted hover:bg-muted' : ''}`}
                                onClick={() => {
                                    router.push(`/folders/${folder._id}?page=${page}`);
                                }}
                            >
                                <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        id={folder._id}
                                        checked={selectedFolders?.includes(folder._id)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                onFolderSelect?.([...(selectedFolders || []), folder._id]);
                                            } else {
                                                onFolderSelect?.((selectedFolders || []).filter((id) => id !== folder._id));
                                            }
                                        }}
                                        className="cursor-pointer"
                                    />
                                </TableCell>
                                {isMobile ? (
                                    <TableCell className="flex max-w-64 flex-col">
                                        <p className="truncate">{folder.name}</p>
                                    </TableCell>
                                ) : (
                                    <>
                                        <TableCell className="w-44">{folder.name}</TableCell>
                                        <TableCell className="max-w-60 truncate">{folder.totalEmails}</TableCell>
                                        <TableCell className="max-w-60 truncate">{folder.totalUnreadEmails}</TableCell>
                                        <TableCell className="w-28 whitespace-nowrap">View Emails</TableCell>
                                    </>
                                )}
                                {/* <TableCell className="w-12 whitespace-nowrap md:w-28">{formatDateToMonthDateString(folder.createdAt)}</TableCell> */}
                                <TableCell className="w-10 whitespace-nowrap">
                                    <Trash
                                        className={`text-red-500 ${(selectedFolders || []).length > 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                        size={16}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if ((selectedFolders || []).length === 0) {
                                                // handleTrashIconClick(folder);
                                            }
                                        }}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </tbody>
                </Table>
            </div>
        </div>
    );
};

export default FoldersTable;
