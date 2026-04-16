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
import React, { useEffect, useState } from 'react';
import { useEnableAccountMutation, useRemoveAccountQuery, useSyncAccountQuery } from '../services/useAccountApi';
import { Switch } from '@/shared/ui/switch';
import APILoader from '@/shared/components/apiLoader';
import { toast } from 'sonner';
import { UI_CONSTANTS } from '@/shared/constants';

interface AccountCardProps {
    account: AccountAttributes;
}

const iconMapping = [
    { name: 'outlook', icon: outlookIcon },
    { name: 'gmail', icon: gmailIcon },
];

const AccountCard: React.FC<AccountCardProps> = ({ account }) => {
    console.log('🚀 ~ AccountCard ~ account:', account);
    const [accountEnabled, setAccountEnabled] = useState<boolean>(account.active);
    const { mutateAsync: removeAccount } = useRemoveAccountQuery();
    const { mutateAsync: syncAccount, isPending: syncingAccount } = useSyncAccountQuery();
    const { mutate: enableAccount, isPending: enablingAccount, data: enableAccountData, error: enableAccountError } = useEnableAccountMutation();

    const handleRemoveAccount = async () => {
        await removeAccount(account._id);
    };

    const handleSyncAccount = async () => {
        await syncAccount(account._id);
    };

    useEffect(() => {
        if (enableAccountData) {
            toast.success(enableAccountData.message, { duration: UI_CONSTANTS.TOAST.DURATION });
        }
        if (enableAccountError) {
            toast.error(enableAccountError.message, { duration: UI_CONSTANTS.TOAST.DURATION });
        }
    }, [enableAccountData, enableAccountError]);

    return (
        <>
            <div className="bg-card flex size-2 h-16 w-full items-center justify-center rounded-xl border p-4 md:w-fit md:max-w-fit">
                <div className="flex w-full items-center gap-2">
                    <APILoader show={enablingAccount} size="xs" />
                    <div className="flex items-center">
                        <Image
                            draggable={false}
                            src={iconMapping.find((item) => item.name === account.provider)?.icon}
                            alt={account.provider}
                            className="h-10pnpm dlx shadcn@latest add switch w-14"
                        />
                    </div>
                    <div className="flex w-full flex-col gap-1">
                        <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-bold">{account.emailAddress}</p>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Switch
                                        id="enable-account"
                                        checked={accountEnabled}
                                        onCheckedChange={(value) => {
                                            setAccountEnabled(value);
                                            enableAccount({ accountId: account._id, active: value });
                                        }}
                                        size="sm"
                                    />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="text-md font-semibold">{account?.active ? 'Disable Account' : 'Enable Account'}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <div className="relative flex w-full items-center justify-between text-nowrap">
                            <p className="text-muted-foreground text-xs font-semibold">
                                {syncingAccount ? (
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
                                            className={syncingAccount ? 'animate-spin hover:cursor-pointer' : 'hover:cursor-pointer'}
                                            onClick={handleSyncAccount}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                        <p className="text-md font-semibold">{syncingAccount ? 'Syncing' : 'Sync'}</p>
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
                                    <TooltipContent side="bottom">
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
