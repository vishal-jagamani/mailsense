'use client';

import React, { useRef } from 'react';

import { AccountProviderIcon } from '@entities/account';
import { AccountAttributes, ComposeEmailRequestBody } from '@mailsense/types';
import { useIsMobile } from '@shared/hooks';
import { Button } from '@shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';
import { Loader2, Paperclip, Trash2 } from 'lucide-react';

export interface ComposeEmailFooterProps {
    accountsData: AccountAttributes[];
    composeEmailBody: ComposeEmailRequestBody;
    setComposeEmailBody: (body: ComposeEmailRequestBody) => void;
    sendEmail: () => Promise<void>;
    handleClose: () => void;
    handleDiscardDraft: () => void;
    isUploadingAttachment: boolean;
    handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

const ComposeEmailFooter: React.FC<ComposeEmailFooterProps> = ({
    accountsData,
    composeEmailBody,
    setComposeEmailBody,
    sendEmail,
    handleDiscardDraft,
    isUploadingAttachment,
    handleFileUpload,
}) => {
    const isMobile = useIsMobile();
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handlePaperclipClick = () => {
        try {
            if (!composeEmailBody?.accountId && accountsData && accountsData.length > 0) {
                setComposeEmailBody({ ...composeEmailBody, accountId: accountsData[0]._id });
            }
            fileInputRef.current?.click();
        } catch (error) {
            console.error('Error handling paperclip click', error);
        }
    };

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
                                accountsData.map((item, index) => {
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
                <Button className="cursor-pointer rounded-lg px-6 font-bold" onClick={sendEmail} disabled={isUploadingAttachment}>
                    Send
                </Button>
                <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileUpload} />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="ml-2 cursor-pointer"
                    onClick={handlePaperclipClick}
                    disabled={isUploadingAttachment}
                >
                    {isUploadingAttachment ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
                </Button>
            </div>
            <Trash2
                className={`text-muted-foreground hover:text-destructive cursor-pointer transition-colors ${isMobile ? 'size-6' : 'size-4'}`}
                // title="Discard draft"
                onClick={handleDiscardDraft}
            />
        </div>
    );
};

export default ComposeEmailFooter;
