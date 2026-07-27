'use client';

import { CircleMinus, RefreshCw } from 'lucide-react';
import React from 'react';

import { useAccountCardActions } from '@features/accounts/hooks/useAccountCardActions';
import { AccountAttributes } from '@mailsense/types';
import APILoader from '@shared/components/apiLoader';
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
} from '@shared/ui/alert-dialog';
import { Switch } from '@shared/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/tooltip';
import { formatEpochTimeToString } from '@shared/utils/formatter';

interface AccountCardActionButtonsProps {
    account: AccountAttributes;
}

const AccountCardActionButtons: React.FC<AccountCardActionButtonsProps> = ({ account }) => {
    const { accountEnabled, toggleAccountEnabled, syncCurrentAccount, removeCurrentAccount, isEnablingAccount, isSyncingAccount, isRemovingAccount } =
        useAccountCardActions(account);

    const isBusy = isEnablingAccount || isSyncingAccount || isRemovingAccount;

    return (
        <div className="flex w-full flex-col gap-1">
            <APILoader show={isBusy} size="xs" />
            <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-bold">{account.emailAddress}</p>
                <Tooltip>
                    <TooltipTrigger>
                        <Switch id="enable-account" checked={accountEnabled} onCheckedChange={(value) => toggleAccountEnabled(value)} size="sm" />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="text-md font-semibold">{account?.active ? 'Disable Account' : 'Enable Account'}</p>
                    </TooltipContent>
                </Tooltip>
            </div>
            <div className="relative flex w-full items-center justify-between text-nowrap">
                <p className="text-muted-foreground text-xs font-semibold">
                    {isSyncingAccount ? (
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
                                className={isSyncingAccount ? 'animate-spin hover:cursor-pointer' : 'hover:cursor-pointer'}
                                onClick={syncCurrentAccount}
                            />
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p className="text-md font-semibold">{isSyncingAccount ? 'Syncing' : 'Sync'}</p>
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
                                            This action cannot be undone. This will permanently delete your account and remove your data from our
                                            servers.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="cursor-pointer font-semibold">Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => removeCurrentAccount()}
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
    );
};

export default AccountCardActionButtons;
