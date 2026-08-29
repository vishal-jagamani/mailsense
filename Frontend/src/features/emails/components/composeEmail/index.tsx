'use client';

import { Paperclip, X } from 'lucide-react';
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
        action: { handleClose, handleDiscardDraft, sendEmail, handleFileUpload, handleRemoveStagedAttachment },
        states: {
            isOpen,
            isToFocused,
            composeEmailBody,
            toEmailSearchText,
            debouncedToEmailSearchText,
            stagedAttachments,
            isUploadingAttachment,
            isSavingDraft,
            lastSavedAt,
        },
        setter: { setIsToFocused, setComposeEmailBody, setToEmailSearchText },
    } = useComposeEmail();

    if (!isOpen) {
        return null;
    }

    return (
        <div className="bg-secondary fixed right-4 bottom-0 z-50 flex h-3/4 w-5/6 flex-col rounded-t-lg shadow-2xl md:w-1/3">
            <APILoader show={composeEmailLoading} size="small" />
            <div className="bg-sidebar flex items-center justify-between rounded-t-lg p-2 px-3">
                <div className="flex items-center gap-2">
                    <p className="text-xs font-bold md:text-sm">New Message</p>
                    {isSavingDraft ? (
                        <span className="text-muted-foreground animate-pulse text-[11px]">Saving draft...</span>
                    ) : lastSavedAt ? (
                        <span className="text-muted-foreground text-[11px]">
                            Saved {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    ) : null}
                </div>
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
            {/* Render Staged Attachment Chips */}
            {stagedAttachments && stagedAttachments.length > 0 && (
                <div className="border-border bg-sidebar/50 flex flex-wrap gap-2 border-t px-3 py-2">
                    {stagedAttachments.map((att) => (
                        <div
                            key={att.attachmentId}
                            className="bg-secondary text-secondary-foreground flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium"
                        >
                            <Paperclip className="text-muted-foreground size-3" />
                            <span className="max-w-[150px] truncate">{att.filename}</span>
                            <span className="text-muted-foreground text-[10px]">({(att.size / 1024).toFixed(1)} KB)</span>
                            <X
                                className="hover:text-destructive size-3 cursor-pointer"
                                onClick={() => handleRemoveStagedAttachment(att.attachmentId)}
                            />
                        </div>
                    ))}
                </div>
            )}
            <ComposeEmailFooter
                accountsData={accountsData || []}
                composeEmailBody={composeEmailBody}
                setComposeEmailBody={setComposeEmailBody}
                handleClose={handleClose}
                handleDiscardDraft={handleDiscardDraft}
                sendEmail={sendEmail}
                isUploadingAttachment={isUploadingAttachment}
                handleFileUpload={handleFileUpload}
            />
        </div>
    );
};

export default ComposeEmail;
