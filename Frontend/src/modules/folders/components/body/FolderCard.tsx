'use client';

import { Dot, Ellipsis, FolderOpenDot, Pen, RefreshCw, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';

import { FolderAttributes } from '@/shared/types/folder.types';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Separator } from '@/shared/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';
import { formatEpochTimeToString } from '@/shared/utils/formatter';

interface FolderCardProps {
    data: FolderAttributes;
}

const FolderCard: React.FC<FolderCardProps> = ({ data }) => {
    console.log("🚀 ~ FolderCard ~ data:", data)
    const router = useRouter();

    return (
        <div className="dark:bg-card bg-secondary flex h-fit flex-col gap-1 rounded-xl border p-2 select-none">
            <div className="flex items-center justify-between">
                <p className={`font-semibold ${data.color.background ? '' : 'text-primary'}`} style={{ color: data.color.background || undefined }}>
                    {data.name}
                </p>
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

                    <Popover>
                        <PopoverTrigger asChild>
                            <div className="flex cursor-pointer items-center gap-0">
                                <Ellipsis size={16} />
                            </div>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-24 p-1 px-2">
                            <div className="flex flex-col gap-2">
                                <p className="flex cursor-pointer items-center gap-1 text-xs font-semibold hover:underline">
                                    <Pen size={12} />
                                    Rename
                                </p>
                                <p className="flex cursor-pointer items-center gap-1 text-xs font-semibold hover:underline">
                                    <RefreshCw size={12} />
                                    Sync
                                </p>
                                <p className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-red-500 hover:underline">
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
