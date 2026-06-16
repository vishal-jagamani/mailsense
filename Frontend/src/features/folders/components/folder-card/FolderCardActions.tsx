'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { CreateFolderBodyParams, FolderAttributes } from '@entities/folder';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/tooltip';
import { Ellipsis, FolderOpenDot, Pen, RefreshCw, Trash } from 'lucide-react';

interface RenameFolderState {
    renameFolderFlag: boolean;
    renameFolderId: string;
    renameFolderValue: string;
    setRenameFolderFlag: (value: boolean) => void;
    setRenameFolderId: (id: string) => void;
    setRenameFolderValue: (value: string) => void;
    handleUpdateFolder: (id: string, body: CreateFolderBodyParams) => void;
}

interface FolderCardActionsProps {
    data: FolderAttributes;
    renameState: RenameFolderState;
    deleteFolder: (id: string) => void;
}

const FolderCardActions: React.FC<FolderCardActionsProps> = ({ data, renameState, deleteFolder }) => {
    const router = useRouter();
    const { renameFolderFlag, renameFolderId, setRenameFolderFlag, setRenameFolderId, setRenameFolderValue } = renameState;
    const [popoverOpen, setPopoverOpen] = useState(false);

    return (
        <div className="mt-6 flex items-center justify-between">
            <div>
                <p className="text-xs">{data.kind}</p>
            </div>
            <div className="flex gap-2">
                <Tooltip>
                    <TooltipTrigger className="flex cursor-pointer items-center gap-0">
                        <FolderOpenDot size={16} onClick={() => router.push(`/folders/${data._id}`)} />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Open folder</p>
                    </TooltipContent>
                </Tooltip>

                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                        <div className="flex cursor-pointer items-center gap-0">
                            <Ellipsis size={16} />
                        </div>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-24 p-1 px-2">
                        <div className="flex flex-col gap-2">
                            {!renameFolderFlag && renameFolderId !== data._id && (
                                <p
                                    className="flex cursor-pointer items-center gap-1 text-xs font-semibold hover:underline"
                                    onClick={() => {
                                        setRenameFolderFlag(true);
                                        setRenameFolderId(data._id);
                                        setRenameFolderValue(data.name);
                                        setPopoverOpen(false);
                                    }}
                                >
                                    <Pen size={12} />
                                    Rename
                                </p>
                            )}
                            <p
                                className="flex cursor-pointer items-center gap-1 text-xs font-semibold hover:underline"
                                onClick={() => setPopoverOpen(false)}
                            >
                                <RefreshCw size={12} />
                                Sync
                            </p>
                            <p
                                className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-red-500 hover:underline"
                                onClick={() => {
                                    deleteFolder(data.providerFolderId);
                                    setPopoverOpen(false);
                                }}
                            >
                                <Trash size={12} />
                                Delete
                            </p>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
};

export default FolderCardActions;
