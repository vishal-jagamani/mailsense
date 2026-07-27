'use client';

import React from 'react';

import { APIResponse, ComposeEmailRequestBody, SearchOtherContactsResponse } from '@mailsense/types';
import { useIsMobile } from '@shared/hooks';
import { Badge } from '@shared/ui/badge';
import { Input } from '@shared/ui/input';
import { Separator } from '@shared/ui/separator';
import { X } from 'lucide-react';
import SearchToEmailPopup from './SearchToEmailPopup';

interface ComposeEmailHeaderProps {
    composeEmailBody: ComposeEmailRequestBody;
    setComposeEmailBody: React.Dispatch<React.SetStateAction<ComposeEmailRequestBody>>;
    isToFocused: boolean;
    setIsToFocused: React.Dispatch<React.SetStateAction<boolean>>;
    toEmailSearchText: string;
    setToEmailSearchText: React.Dispatch<React.SetStateAction<string>>;
    searchOtherContactsData: APIResponse<SearchOtherContactsResponse[]> | null;
    debouncedToEmailSearchText: string;
}

const ComposeEmailHeader: React.FC<ComposeEmailHeaderProps> = ({
    composeEmailBody,
    setComposeEmailBody,
    isToFocused,
    setIsToFocused,
    searchOtherContactsData,
    toEmailSearchText,
    setToEmailSearchText,
    debouncedToEmailSearchText,
}) => {
    const isMobile = useIsMobile();

    return (
        <div className="flex flex-col">
            {composeEmailBody.to.length > 0 && (
                <div className="flex flex-wrap gap-2 p-1 px-2">
                    {composeEmailBody.to.map((item) => {
                        return (
                            <Badge key={item} variant="outline" className="px-2 py-1">
                                {item}
                                <span
                                    className="hover:bg-muted ml-1 flex cursor-pointer items-center justify-center rounded-full"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setComposeEmailBody((prev) => ({
                                            ...prev,
                                            to: prev.to.filter((email) => email !== item),
                                        }));
                                    }}
                                >
                                    <X className="size-3" strokeWidth={isMobile ? 2 : 3} />
                                </span>
                            </Badge>
                        );
                    })}
                </div>
            )}
            <div className="relative flex flex-col">
                <Input
                    className={`${isMobile ? 'text-xs' : 'text-sm'} focus-visible:bg-sidebar rounded-none border-none focus-visible:ring-0`}
                    placeholder={isToFocused ? 'To' : 'Recipients'}
                    value={toEmailSearchText}
                    onFocus={() => setIsToFocused(true)}
                    onBlur={() => setIsToFocused(false)}
                    onChange={(e) => {
                        setToEmailSearchText(e.target.value);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = toEmailSearchText.trim();
                            if (val && !composeEmailBody.to.includes(val)) {
                                setComposeEmailBody((prev) => ({ ...prev, to: [...prev.to, val] }));
                                setToEmailSearchText('');
                            }
                        }
                    }}
                />
                <SearchToEmailPopup
                    data={isToFocused && (debouncedToEmailSearchText?.trim().length ?? 0) > 2 ? (searchOtherContactsData?.data ?? []) : []}
                    setComposeEmailBody={setComposeEmailBody}
                    onSelect={() => setToEmailSearchText('')}
                />
            </div>
            <Separator className="bg-sidebar h-2" />
            <Input
                className={`${isMobile ? 'text-xs' : 'text-sm'} focus-visible:bg-sidebar rounded-none border-none focus-visible:ring-0`}
                placeholder="Subject"
                onChange={(e) => setComposeEmailBody({ ...composeEmailBody, subject: e.target.value })}
            />
        </div>
    );
};

export default ComposeEmailHeader;
