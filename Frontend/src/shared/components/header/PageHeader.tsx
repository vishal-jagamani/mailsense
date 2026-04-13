'use client';

import Image from 'next/image';
import React, { useState } from 'react';

import { useSyncAllAccounts } from '@/modules/accounts/services/useAccountApi';
import { Button } from '@/shared/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu';
import { useAuthStore } from '@/store';
import GmailIcon from '@assets/icons/gmail/icons8-gmail-144.png';
import OutlookIcon from '@assets/icons/outlook/icons8-outlook-144.svg';
import { useIsMobile } from '@/shared/hooks/use-mobile';

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
    const isMobile = useIsMobile();
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
            <div className={`${isMobile ? 'justify-end' : 'justify-between'} border-muted flex w-full items-center border-b-2 pb-2 mt-1`}>
                {!isMobile && <p className="text-md ml-2 font-bold text-nowrap md:ml-4 md:text-xl">{title}</p>}
                {button && (
                    <>
                        <div className="flex items-center gap-2 md:gap-4">
                            <Button
                                variant="outline"
                                className={`cursor-pointer ${isMobile ? 'py-4 text-xs' : 'py-5 text-sm'}`}
                                onClick={handleSyncAllAccounts}
                                disabled={isSyncing}
                                size={isMobile ? 'xs' : 'sm'}
                            >
                                {isSyncing ? 'Syncing...' : 'Sync All Accounts'}
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger className="mr-2 border-0 select-none md:mr-4" asChild>
                                    <Button
                                        className={`bg-primary cursor-pointer font-semibold ${isMobile ? 'py-4 text-xs' : 'py-5 text-sm'}`}
                                        size={isMobile ? 'xs' : 'sm'}
                                    >
                                        Connect Account
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-16 md:w-full">
                                    {dropdownOptions?.map((option) => {
                                        return (
                                            <DropdownMenuItem
                                                key={option.name}
                                                className={`cursor-pointer ${isMobile ? 'gap-1' : 'gap-2'}`}
                                                onClick={() => dropdownMenuItemClick?.(option)}
                                            >
                                                <Image
                                                    draggable={false}
                                                    src={iconMapping.find((val) => val.name === option.name)?.icon}
                                                    alt={option.name}
                                                    className={isMobile ? 'size-5' : 'size-5'}
                                                />
                                                <p className={`${isMobile ? 'text-xs ' : 'text-sm'} font-semibold`}>{option.displayName}</p>
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
