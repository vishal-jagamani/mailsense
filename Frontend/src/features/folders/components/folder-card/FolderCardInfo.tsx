'use client';

import React from 'react';

import { FolderCardInfoProps } from '@features/folders/types/folders-components.types';
import { Separator } from '@shared/ui/separator';
import { formatEpochTimeToString } from '@shared/utils';

const FolderCardInfo: React.FC<FolderCardInfoProps> = ({ data }) => {
    return (
        <>
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
        </>
    );
};

export default FolderCardInfo;
