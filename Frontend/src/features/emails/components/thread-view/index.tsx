'use client';

import React, { useState } from 'react';

import { ThreadViewProps } from '@features/emails/types';
import { SuggestedReplyItem } from '@mailsense/types';
import { useComposeEmailPopupStore } from '@shared/store';
import { Separator } from '@shared/ui/separator';
import EmailAiSummaryCard from '../ai/EmailAiSummaryCard';
import SuggestedRepliesBar from '../ai/SuggestedRepliesBar';
import AttachmentList from '../attachments';
import EmailBodyPreview from '../EmailBodyPreview';
import ThreadViewHeaderBar from './ThreadViewHeaderBar';

const ThreadView: React.FC<ThreadViewProps> = ({ emails, account }) => {
    const { openCompose } = useComposeEmailPopupStore();

    const latestEmailId = emails.length > 0 ? String(emails[emails.length - 1]._id) : '';
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set([latestEmailId]));

    const toggleExpand = (id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // eslint-disable-next-line unused-imports/no-unused-vars
    const handleSelectReply = (reply: SuggestedReplyItem) => {
        openCompose();
    };

    return (
        <div className="flex w-full flex-col px-4">
            {/* Thread AI Summary Card */}
            {latestEmailId && <EmailAiSummaryCard emailId={latestEmailId} initialSummary={emails[0]?.aiSummary} />}
            {emails.map((email, index) => {
                const emailId = String(email._id);
                const isExpanded = expandedIds.has(emailId);
                const isLatest = index === emails.length - 1;

                return (
                    <div key={index} className={`rounded-lg shadow-sm transition-all`}>
                        {/* Header Bar */}
                        <ThreadViewHeaderBar
                            key={index}
                            emailId={emailId}
                            email={email}
                            toggleExpand={toggleExpand}
                            isExpanded={isExpanded}
                            accountEmailAddress={account?.emailAddress || ''}
                        />
                        <Separator />

                        {/* Collapsible Body */}
                        {isExpanded && (
                            <>
                                <EmailBodyPreview html={email.bodyHtml} plain={email.bodyPlain} />
                                {email.attachments && email.attachments.length > 0 && (
                                    <AttachmentList emailId={emailId} attachments={email.attachments} />
                                )}
                            </>
                        )}
                        {isLatest && <SuggestedRepliesBar emailId={emailId} onSelectReply={handleSelectReply} />}
                    </div>
                );
            })}
        </div>
    );
};

export default ThreadView;
