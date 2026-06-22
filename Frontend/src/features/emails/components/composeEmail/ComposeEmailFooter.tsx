'use client';

import React from 'react';

import { AccountAttributes, AccountProviderIcon } from '@entities/account';
import { useIsMobile } from '@shared/hooks';
import { Button } from '@shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';
import { Trash2 } from 'lucide-react';

interface ComposeEmailFooterProps {
    accountsData: AccountAttributes[];
    composeEmailBody: any;
    setComposeEmailBody: any;
    sendEmail: any;
    handleClose: any;
}

const ComposeEmailFooter: React.FC<ComposeEmailFooterProps> = ({ accountsData, composeEmailBody, setComposeEmailBody, sendEmail, handleClose }) => {
    const isMobile = useIsMobile();

    return (
        <div className="flex items-center justify-between md:p-2">
            <div className="flex w-full items-center">
                <div className="my-2 flex w-3/6 px-2">
                    <Select
                        value={composeEmailBody?.accountId || ''}
                        onValueChange={(value) => setComposeEmailBody({ ...composeEmailBody, accountId: value })}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select account" className="text-xs" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                            {accountsData &&
                                accountsData?.map((item, index) => {
                                    return (
                                        <SelectItem key={index + 1} value={item?._id} className="text-xs">
                                            <AccountProviderIcon provider={item.provider} className="size-4" />
                                            {item?.emailAddress}
                                        </SelectItem>
                                    );
                                })}
                        </SelectContent>
                    </Select>
                </div>
                <Button className="cursor-pointer rounded-lg px-6 font-bold" onClick={sendEmail}>
                    Send
                </Button>
            </div>
            <Trash2 className={`cursor-pointer ${isMobile ? 'size-16 h-10 w-10' : 'size-4'}`} onClick={handleClose} />
        </div>
    );
};

export default ComposeEmailFooter;
