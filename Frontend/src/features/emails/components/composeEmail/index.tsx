'use client';

import { X } from 'lucide-react';
import React from 'react';

import RichTextEditor from '@features/emails/components/rich-text-editor';
import { useComposeEmail } from '@features/emails/hooks';
import APILoader from '@shared/components/apiLoader';
import { useIsMobile } from '@shared/hooks';
import ComposeEmailFooter from './ComposeEmailFooter';
import ComposeEmailHeader from './ComposeEmailHeader';

const ComposeEmail: React.FC = () => {
    const isMobile = useIsMobile();

    const {
        accounts: { data: accountsData },
        searchOtherContacts: { data: searchOtherContactsData },
        composeEmail: { isLoading: composeEmailLoading },
        action: { handleClose, sendEmail },
        states: { isOpen, isToFocused, composeEmailBody, toEmailSearchText, debouncedToEmailSearchText },
        setter: { setIsToFocused, setComposeEmailBody, setToEmailSearchText },
    } = useComposeEmail();

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

            <ComposeEmailHeader
                composeEmailBody={composeEmailBody}
                setComposeEmailBody={setComposeEmailBody}
                isToFocused={isToFocused}
                setIsToFocused={setIsToFocused}
                toEmailSearchText={toEmailSearchText}
                setToEmailSearchText={setToEmailSearchText}
                searchOtherContactsData={searchOtherContactsData || null}
                debouncedToEmailSearchText={debouncedToEmailSearchText}
            />
            <div className="min-h-0 flex-1 overflow-hidden p-2 pr-0 pb-0">
                <RichTextEditor
                    content={composeEmailBody.body || ''}
                    onContentChange={(content) => setComposeEmailBody({ ...composeEmailBody, body: content })}
                    placeholder="Write your email..."
                />
            </div>
            <ComposeEmailFooter
                accountsData={accountsData || []}
                composeEmailBody={composeEmailBody}
                setComposeEmailBody={setComposeEmailBody}
                handleClose={handleClose}
                sendEmail={sendEmail}
            />
        </div>
    );
};

export default ComposeEmail;
