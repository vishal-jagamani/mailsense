'use client';

import React, { useEffect, useState } from 'react';

import { AccountProviderIcon } from '@entities/account';
import { Filter, FilterOption } from '@mailsense/types';
import { Button } from '@shared/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';
import { Switch } from '@shared/ui/switch';
import { ListFilter } from 'lucide-react';

interface FilterModalProps {
    filter: Filter | null;
    onFilterChange: (filter: Filter) => void;
    filterOptions: FilterOption[];
}

const FilterModal: React.FC<FilterModalProps> = ({ filter, onFilterChange, filterOptions }) => {
    const [localFilterObject, setLocalFilterObject] = useState<Filter | null>(filter || null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setLocalFilterObject(filter);
    }, [filter]);

    const handleApplyButtonClick = () => {
        onFilterChange?.(localFilterObject as Filter);
        setIsOpen(false);
    };

    const getSelectedValue = (name: string) => {
        if (!localFilterObject) return '';
        const val = localFilterObject[name as keyof Filter];
        if (Array.isArray(val)) {
            return val[0] || '';
        }
        return (val as string) || '';
    };

    const handleValueChange = (name: string, value: string | boolean) => {
        setLocalFilterObject((prev) => {
            const updated: Filter = { ...(prev || {}) };
            if (name === 'accountId' && typeof value === 'string') {
                updated.accountId = value ? [value] : undefined;
            } else if (name === 'folders' && typeof value === 'string') {
                updated.folders = value ? [value] : undefined;
            } else {
                (updated as Record<string, unknown>)[name] = value;
            }
            return updated;
        });
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-24 cursor-pointer">
                    <ListFilter /> Filter
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-80">
                <div className="flex w-full flex-col gap-2">
                    {filterOptions?.map((item) => {
                        return (
                            <>
                                {item.type === 'dropdown' && (
                                    <div className="flex w-full flex-col" key={item.id}>
                                        <p className="p-1 text-xs">{item.label}</p>
                                        <Select value={getSelectedValue(item.name)} onValueChange={(value) => handleValueChange(item.name, value)}>
                                            <SelectTrigger className="w-full text-xs">
                                                <SelectValue placeholder={`Select ${item.label}`} />
                                            </SelectTrigger>
                                            <SelectContent position="popper" className="max-h-56 overflow-auto">
                                                {Array.isArray(item?.data) &&
                                                    item?.data?.length &&
                                                    item?.data?.map((option, index) => {
                                                        return (
                                                            <SelectItem key={option.id || index} value={option.name} className="text-xs">
                                                                {item.name === 'accountId' && option.provider && (
                                                                    <AccountProviderIcon provider={option.provider} className="size-4" />
                                                                )}
                                                                {option.label}
                                                            </SelectItem>
                                                        );
                                                    })}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                {item.type === 'toggle' && (
                                    <>
                                        <div className="flex items-center">
                                            <p className="p-1 text-xs">{item.label}</p>
                                            <Switch
                                                id={item.name}
                                                checked={localFilterObject?.unread}
                                                onCheckedChange={(value) => handleValueChange(item.name, value)}
                                            />
                                        </div>
                                    </>
                                )}
                            </>
                        );
                    })}
                </div>
                <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => setIsOpen(false)}>
                        Cancel
                    </Button>
                    <Button size="sm" variant="default" className="cursor-pointer px-5" onClick={() => handleApplyButtonClick()}>
                        Apply
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default FilterModal;
