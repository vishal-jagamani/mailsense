'use client';

import { Trash2, X } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';

import { useIsMobile } from '@/hooks/use-mobile';
import { useGetAccountsQuery } from '@/modules/accounts/services/useAccountApi';
import { useComposeEmailPopupStore } from '@/shared/store/composeEmailPopup.store';
import { ComposeEmailRequestBody } from '@/shared/types/email.types';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Separator } from '@/shared/ui/separator';
import { useAuthStore } from '@/store';
import gmailIcon from '@assets/icons/gmail/icons8-gmail-96.png';
import outlookIcon from '@assets/icons/outlook/icons8-outlook-96.svg';
import RichTextEditor from '../editor/RichTextEditor';
import { useComposeEmailMutation } from '@/modules/emails/services/useEmailApi';
import APILoader from '@/shared/components/apiLoader';
import { toast } from 'sonner';
import { MESSAGES, UI_CONSTANTS } from '@/shared/constants';

const iconMapping = [
    { name: 'outlook', icon: outlookIcon },
    { name: 'gmail', icon: gmailIcon },
];

const ComposeEmailPopup: React.FC = () => {
    const isMobile = useIsMobile();
    const user = useAuthStore((state) => state.user);
    const { isOpen, closeCompose } = useComposeEmailPopupStore();

    const [isToFocused, setIsToFocused] = React.useState(false);
    const [composeEmailBody, setComposeEmailBody] = useState<ComposeEmailRequestBody>({
        accountId: '',
        to: [],
        subject: '',
        body: '',
    });

    const { data: accounts, isLoading: accountsLoading, error: accountError } = useGetAccountsQuery(user?.id ?? '');
    const { mutate: composeEmail, data: composeEmailData, isPending: composeEmailLoading, error: composeEmailError } = useComposeEmailMutation();

    useEffect(() => {
        if (composeEmailData) {
            toast.success(MESSAGES.EMAILS.SEND_EMAIL_SUCCESS, { duration: UI_CONSTANTS.TOAST.DURATION });
            handleClose();
        }
        if (composeEmailError) {
            toast.error(MESSAGES.EMAILS.SEND_EMAIL_ERROR, { duration: UI_CONSTANTS.TOAST.DURATION });
        }
    }, [composeEmailData, composeEmailError]);

    const sendEmail = async () => {
        composeEmail({
            accountId: composeEmailBody.accountId,
            to: composeEmailBody.to,
            subject: composeEmailBody.subject,
            body: composeEmailBody.body,
        });
    };

    const handleClose = () => {
        closeCompose();
        setComposeEmailBody({
            accountId: '',
            to: [],
            subject: '',
            body: '',
        });
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="bg-secondary fixed right-4 bottom-0 z-50 flex h-3/4 w-5/6 flex-col rounded-t-lg md:w-1/3">
            <APILoader show={composeEmailLoading} size="small" />
            <div className="bg-sidebar flex items-center justify-between rounded-t-lg p-2">
                <p className="text-xs font-bold md:text-sm">New email</p>
                <X className="size-4 cursor-pointer" strokeWidth={isMobile ? 2 : 3} onClick={handleClose} />
            </div>

            <div className="flex flex-col">
                <div className="flex">
                    <Input
                        className={`${isMobile ? 'text-xs' : 'text-sm'} focus-visible:bg-sidebar rounded-none border-none focus-visible:ring-0`}
                        placeholder={isToFocused ? 'To' : 'Recipients'}
                        onFocus={() => setIsToFocused(true)}
                        onBlur={() => setIsToFocused(false)}
                        onChange={(e) => setComposeEmailBody({ ...composeEmailBody, to: e.target.value.split(',') })}
                    />
                </div>
                <Separator className="bg-sidebar h-2" />
                <Input
                    className={`${isMobile ? 'text-xs' : 'text-sm'} focus-visible:bg-sidebar rounded-none border-none focus-visible:ring-0`}
                    placeholder="Subject"
                    onChange={(e) => setComposeEmailBody({ ...composeEmailBody, subject: e.target.value })}
                />
            </div>
            <div className="min-h-0 flex-1 overflow-hidden p-2 pr-0 pb-0">
                <RichTextEditor
                    content={composeEmailBody.body || ''}
                    onContentChange={(content) => setComposeEmailBody({ ...composeEmailBody, body: content })}
                    placeholder="Write your email..."
                />
            </div>
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
                    <Button className="cursor-pointer rounded-lg px-6 font-bold" onClick={sendEmail}>
                        Send
                    </Button>
                </div>
                <Trash2 className={`cursor-pointer ${isMobile ? 'h-10 w-10 size-16' : 'size-4 '}`} onClick={handleClose} />
            </div>
        </div>
    );
};

export default ComposeEmailPopup;
