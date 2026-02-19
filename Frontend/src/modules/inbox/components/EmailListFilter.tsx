'use client';

import { ListFilter } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';

import { AccountAttributes } from '@/shared/types/account.types';
import { DATE_RANGE, GetAllEmailsFilters } from '@/shared/types/inbox.types';
import { Button } from '@/shared/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import gmailIcon from '@assets/icons/gmail/icons8-gmail-96.png';
import outlookIcon from '@assets/icons/outlook/icons8-outlook-96.svg';
import { DATE_RANGE_DROPDOWN_OPTIONS } from '../constants/api.constants';

const iconMapping = [
    { name: 'outlook', icon: outlookIcon },
    { name: 'gmail', icon: gmailIcon },
];

interface EmailListFilterProps {
    accounts: AccountAttributes[];
    filter: GetAllEmailsFilters | null;
    onFilterChange: (filter: GetAllEmailsFilters) => void;
}

const EmailListFilter: React.FC<EmailListFilterProps> = ({ accounts, filter, onFilterChange }) => {
    const [localFilterObject, setLocalFilterObject] = useState<GetAllEmailsFilters | null>(filter || null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setLocalFilterObject(filter);
    }, [filter]);

    const handleApplyButtonClick = () => {
        onFilterChange?.(localFilterObject as GetAllEmailsFilters);
        setIsOpen(false); // Close the popover
    };

    return (
        <div className="flex items-center justify-center">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-24 cursor-pointer">
                        <ListFilter /> Filter
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-80">
                    <div className="flex w-full flex-col gap-2">
                        <div className="flex w-full flex-col">
                            <p className="p-1 text-sm">Account</p>
                            <Select
                                value={localFilterObject?.accountId?.[0] || ''}
                                onValueChange={(value) => setLocalFilterObject({ ...localFilterObject, accountId: [value] })}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                                <SelectContent position="popper">
                                    {accounts &&
                                        accounts?.map((item, index) => {
                                            return (
                                                <SelectItem key={index + 1} value={item?._id} className="text-xs">
                                                    <Image
                                                        draggable={false}
                                                        src={iconMapping?.find((val) => val.name === item.provider)?.icon}
                                                        alt={item.provider}
                                                        className="size-4"
                                                    />
                                                    {item?.emailAddress}
                                                </SelectItem>
                                            );
                                        })}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex w-full flex-col">
                            <p className="p-1 text-sm">Date</p>
                            <Select
                                value={localFilterObject?.dateRange}
                                onValueChange={(value) => setLocalFilterObject({ ...localFilterObject, dateRange: value as DATE_RANGE })}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select time" />
                                </SelectTrigger>
                                <SelectContent position="popper">
                                    {DATE_RANGE_DROPDOWN_OPTIONS.map((item, index) => {
                                        return (
                                            <SelectItem key={index + 1} value={item.name} className="text-xs">
                                                {item?.label}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => setIsOpen(false)}>
                                Cancel
                            </Button>
                            <Button size="sm" variant="default" className="cursor-pointer px-5" onClick={() => handleApplyButtonClick()}>
                                Apply
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default EmailListFilter;
