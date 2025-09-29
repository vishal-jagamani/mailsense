'use client';

import { AccountAttributes } from '@/shared/types/account.types';
import { Card, CardContent } from '@/shared/ui/card';
import { Tooltip, TooltipContent } from '@/shared/ui/tooltip';
import { formatEpochTimeToString } from '@/shared/utils/formatter';
import gmailIcon from '@assets/icons/gmail/icons8-gmail-240.png';
import outlookIcon from '@assets/icons/outlook/icons8-outlook-240.svg';
import { TooltipTrigger } from '@radix-ui/react-tooltip';
import { CircleMinus, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import React, { useState } from 'react';

interface AccountCardProps {
    account: AccountAttributes;
}

const iconMapping = [
    { name: 'outlook', icon: outlookIcon },
    { name: 'gmail', icon: gmailIcon },
];

const AccountCard: React.FC<AccountCardProps> = ({ account }) => {
    const [syncing, setSyncing] = useState<boolean>(false);

    return (
        <>
            <Card className="w-80 max-w-80 min-w-80 p-2 pl-0 select-none">
                <CardContent className="flex items-center gap-2">
                    <div className="flex items-center">
                        <Image
                            draggable={false}
                            src={iconMapping.find((item) => item.name === account.provider)?.icon}
                            alt={account.provider}
                            className="size-10"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-bold">{account.emailAddress}</p>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-nowrap">
                            <p className="text-muted-foreground text-xs font-semibold">
                                {syncing ? (
                                    <p className="animate-pulse text-green-500 delay-100">Syncing...</p>
                                ) : (
                                    `Last synced ${formatEpochTimeToString(account.lastSyncedAt)} ago`
                                )}
                            </p>
                            <div className="flex gap-2">
                                <Tooltip>
                                    <TooltipTrigger>
                                        <RefreshCw
                                            size={16}
                                            className={syncing ? 'animate-spin hover:cursor-pointer' : 'hover:cursor-pointer'}
                                            onClick={() => setSyncing(!syncing)}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-md font-semibold">{syncing ? 'Syncing' : 'Sync'}</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <CircleMinus size={16} className="text-red-500 hover:cursor-pointer" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-md font-semibold">Remove</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </>
    );
};

export default AccountCard;
