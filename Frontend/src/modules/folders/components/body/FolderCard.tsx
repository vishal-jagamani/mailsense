'use client';

import { Check, Dot, Ellipsis, FolderOpenDot, Pen, RefreshCw, Trash, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { CreateFolderBodyParams, FolderAttributes } from '@shared/types';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/popover';
import { Separator } from '@shared/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/tooltip';
import { formatEpochTimeToString } from '@shared/utils/formatter';

interface RenameFolderState {
    renameFolderFlag: boolean;
    renameFolderId: string;
    renameFolderValue: string;
    setRenameFolderFlag: (value: boolean) => void;
    setRenameFolderId: (id: string) => void;
    setRenameFolderValue: (value: string) => void;
    handleUpdateFolder: (id: string, body: CreateFolderBodyParams) => void;
}

interface FolderCardProps {
    data: FolderAttributes;
    renameState: RenameFolderState;
    deleteFolder: (id: string) => void;
}

const FolderCard: React.FC<FolderCardProps> = ({ data, renameState, deleteFolder }) => {
    const { renameFolderFlag, renameFolderId, renameFolderValue, setRenameFolderFlag, setRenameFolderId, setRenameFolderValue, handleUpdateFolder } =
        renameState;
    const router = useRouter();
    const [popoverOpen, setPopoverOpen] = useState(false);

    return (
        <div className="dark:bg-card bg-secondary flex h-fit flex-col gap-1 rounded-xl border p-2 select-none">
            <div className="flex items-center justify-between">
                {renameFolderFlag && renameFolderId === data._id ? (
                    <div className="flex w-full gap-2 pr-2">
                        <input
                            type="text"
                            value={renameFolderValue !== undefined ? renameFolderValue : data.name}
                            onChange={(e) => setRenameFolderValue(e.target.value)}
                            className="w-full border-b font-semibold focus:outline-none"
                        />
                        <div className="flex items-center justify-center gap-1">
                            <Check
                                className="size-5 cursor-pointer text-blue-500"
                                onClick={() => {
                                    handleUpdateFolder(data.providerFolderId, { accountId: data.accountId, folderName: renameFolderValue });
                                    setRenameFolderFlag(false);
                                    setRenameFolderId('');
                                }}
                            />
                            <X
                                className="size-5 cursor-pointer text-red-500"
                                onClick={() => {
                                    setRenameFolderFlag(false);
                                    setRenameFolderId('');
                                }}
                            />
                        </div>
                    </div>
                ) : (
                    <p
                        className={`font-semibold ${data.color.background ? '' : 'text-primary'}`}
                        style={{ color: data.color.background || undefined }}
                    >
                        {data.name}
                    </p>
                )}
                {data.totalUnreadEmails > 0 ? (
                    <Tooltip>
                        <TooltipTrigger className="flex items-center gap-0">
                            <p className="text-muted-foreground text-sm font-bold">{data.totalUnreadEmails}</p>
                            {data.totalUnreadEmails > 0 && <Dot color="red" size={25} className="-mt-2 -ml-2" />}
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{data.totalUnreadEmails} Unread emails</p>
                        </TooltipContent>
                    </Tooltip>
                ) : (
                    <p className="text-muted-foreground text-sm font-bold">{data.totalUnreadEmails}</p>
                )}
            </div>
            <div className="flex gap-2">
                <p className="text-xs">{(data?.providerMeta?.provider as string) || 'vishaljagamani20@gmail.com'}</p>
            </div>
            <div className="flex gap-2">
                <p className="text-xs">
                    {data.totalEmails} email{data.totalEmails !== 1 ? 's' : ''}
                </p>
                <Separator orientation="vertical" />
                <p className="text-xs">Synced {formatEpochTimeToString(new Date(data.lastSyncedAt).getTime())} ago</p>
            </div>
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
        </div>
    );
};

export default FolderCard;
