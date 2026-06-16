'use client';

import { Check, Dot, X } from 'lucide-react';
import React from 'react';

import { CreateFolderBodyParams, FolderAttributes } from '@entities/folder';
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/tooltip';

interface RenameFolderState {
    renameFolderFlag: boolean;
    renameFolderId: string;
    renameFolderValue: string;
    setRenameFolderFlag: (value: boolean) => void;
    setRenameFolderId: (id: string) => void;
    setRenameFolderValue: (value: string) => void;
    handleUpdateFolder: (id: string, body: CreateFolderBodyParams) => void;
}

interface FolderCardHeaderProps {
    data: FolderAttributes;
    renameState: RenameFolderState;
}

const FolderCardHeader: React.FC<FolderCardHeaderProps> = ({ data, renameState }) => {
    const { renameFolderFlag, renameFolderId, renameFolderValue, setRenameFolderFlag, setRenameFolderId, setRenameFolderValue, handleUpdateFolder } =
        renameState;

    return (
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
                <p className={`font-semibold ${data.color.background ? '' : 'text-primary'}`} style={{ color: data.color.background || undefined }}>
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
    );
};

export default FolderCardHeader;
