'use client';

import Image from 'next/image';
import React, { useState } from 'react';

import { useSyncAllAccounts } from '@/modules/accounts/services/useAccountApi';
import { Button } from '@/shared/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu';
import { useAuthStore } from '@/store';
import GmailIcon from '@assets/icons/gmail/icons8-gmail-144.png';
import OutlookIcon from '@assets/icons/outlook/icons8-outlook-144.svg';

interface PageHeaderProps {
    title: string;
    button?: boolean;
    dropdownOptions?: {
        id: number;
        name: string;
        displayName: string;
    }[];
    dropdownMenuItemClick?: (dropdownOption: { id: number; name: string; displayName: string }) => void;
}

const iconMapping = [
    { name: 'gmail', icon: GmailIcon },
    { name: 'outlook', icon: OutlookIcon },
];

const PageHeader: React.FC<PageHeaderProps> = ({ title, button, dropdownOptions, dropdownMenuItemClick }) => {
    const { user: currentUser } = useAuthStore();
    const { syncAllAccounts } = useSyncAllAccounts();
    const [isSyncing, setIsSyncing] = useState<boolean>(false);

    const handleSyncAllAccounts = async () => {
        if (currentUser?.id) {
            setIsSyncing(true);
            try {
                await syncAllAccounts(currentUser.id);
            } catch (error) {
                // Error is handled in the hook
            } finally {
                setIsSyncing(false);
            }
        }
    };

    return (
        <>
            <div className="border-muted flex w-full items-center justify-between border-b-2 pb-2">
                <p className="ml-4 text-xl font-bold">{title}</p>
                {button && (
                    <>
                        <div className="flex items-center gap-4">
                            <Button variant="outline" className="cursor-pointer" onClick={handleSyncAllAccounts} disabled={isSyncing}>
                                {isSyncing ? 'Syncing...' : 'Sync All Accounts'}
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger className="mr-4 border-0 select-none" asChild>
                                    <Button className="bg-primary text-md cursor-pointer font-semibold">Connect Account</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-40">
                                    {dropdownOptions?.map((option) => {
                                        // TODO: Don't show outlook option, need to change this post outlook connector release
                                        if (option.name === 'outlook') {
                                            return null;
                                        }
                                        return (
                                            <DropdownMenuItem
                                                key={option.name}
                                                className="cursor-pointer gap-2"
                                                onClick={() => dropdownMenuItemClick?.(option)}
                                            >
                                                <Image
                                                    draggable={false}
                                                    src={iconMapping.find((val) => val.name === option.name)?.icon}
                                                    alt={option.name}
                                                    className="size-5"
                                                />
                                                <p className="text-md font-bold">{option.displayName}</p>
                                            </DropdownMenuItem>
                                        );
                                    })}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

export default PageHeader;
