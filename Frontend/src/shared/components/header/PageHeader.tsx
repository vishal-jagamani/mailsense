'use client';

import { Button } from '@/shared/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu';
import GmailIcon from '@assets/icons/gmail/icons8-gmail-144.png';
import OutlookIcon from '@assets/icons/outlook/icons8-outlook-144.svg';
import Image from 'next/image';
import React from 'react';

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
    return (
        <>
            <div className="border-muted flex w-full items-center justify-between border-b-2 pb-2">
                <p className="ml-4 text-xl font-bold">{title}</p>
                {button && (
                    <>
                        <div className="flex items-center gap-4">
                            <Button variant="outline" className="cursor-pointer">Sync All Accounts</Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger className="mr-4 border-0 select-none" asChild>
                                    <Button className="bg-primary text-md cursor-pointer font-semibold">Connect Account</Button>
                                    {/* Connect Account */}
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-40">
                                    {dropdownOptions?.map((option) => {
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
