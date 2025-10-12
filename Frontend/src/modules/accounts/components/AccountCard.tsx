'use client';

import { AccountAttributes } from '@/shared/types/account.types';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/shared/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';
import { formatEpochTimeToString } from '@/shared/utils/formatter';
import gmailIcon from '@assets/icons/gmail/icons8-gmail-240.png';
import outlookIcon from '@assets/icons/outlook/icons8-outlook-240.svg';
import { CircleMinus, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import React, { useState } from 'react';
import { useRemoveAccountQuery } from '../services/useAccountApi';

interface AccountCardProps {
    account: AccountAttributes;
}

const iconMapping = [
    { name: 'outlook', icon: outlookIcon },
    { name: 'gmail', icon: gmailIcon },
];

const AccountCard: React.FC<AccountCardProps> = ({ account }) => {
    const [syncing, setSyncing] = useState<boolean>(false);

    const { mutateAsync: removeAccount } = useRemoveAccountQuery();

    const handleRemoveAccount = async () => {
        const response = await removeAccount(account._id);
        console.log('response', response);
    };

    return (
        <>
            {/* <Card className="w-80 max-w-80 min-w-80 p-2 px-2 pl-0 select-none">
                <CardContent className="flex w-full items-center gap-2">
                    <div className="flex items-center">
                        <Image
                            draggable={false}
                            src={iconMapping.find((item) => item.name === account.provider)?.icon}
                            alt={account.provider}
                            className="size-10"
                        />
                    </div>
                    <div className="flex w-full flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-bold">{account.emailAddress}</p>
                        </div>
                        <div className="relative flex w-full items-center justify-between gap-4 text-nowrap">
                            <p className="text-muted-foreground text-xs font-semibold">
                                {syncing ? (
                                    <span className="animate-pulse text-green-500 delay-100">Syncing...</span>
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
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <CircleMinus size={16} className="text-red-500 hover:cursor-pointer" />
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete your account and remove your data
                                                        from our servers.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="cursor-pointer font-semibold">Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => console.log('click')}
                                                        className="text-primary cursor-pointer bg-red-600 font-semibold hover:bg-red-500"
                                                    >
                                                        Remove Account
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-md font-semibold">Remove</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card> */}
            <div className="bg-card flex size-2 h-16 w-80 max-w-80 items-center justify-center rounded-xl border p-4">
                <div className="flex w-full items-center gap-2">
                    <div className="flex items-center">
                        <Image
                            draggable={false}
                            src={iconMapping.find((item) => item.name === account.provider)?.icon}
                            alt={account.provider}
                            className="size-10"
                        />
                    </div>
                    <div className="flex w-full flex-col gap-1">
                        <div className="flex items-center">
                            <p className="truncate text-sm font-bold">{account.emailAddress}</p>
                        </div>
                        <div className="relative flex w-full items-center justify-between text-nowrap">
                            <p className="text-muted-foreground text-xs font-semibold">
                                {syncing ? (
                                    <span className="animate-pulse text-green-500 delay-100">Syncing...</span>
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
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <CircleMinus size={16} className="text-red-500 hover:cursor-pointer" />
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete your account and remove your data
                                                        from our servers.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="cursor-pointer font-semibold">Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleRemoveAccount()}
                                                        className="text-primary cursor-pointer bg-red-600 font-semibold hover:bg-red-500"
                                                    >
                                                        Remove Account
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-md font-semibold">Remove</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AccountCard;
