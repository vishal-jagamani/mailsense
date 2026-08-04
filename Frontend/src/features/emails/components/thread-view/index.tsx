'use client';

import React, { useState } from 'react';

import { AccountAttributes, EmailAttributes } from '@mailsense/types';
import { Separator } from '@shared/ui/separator';
import EmailBodyPreview from '../EmailBodyPreview';
import ThreadViewHeaderBar from './ThreadViewHeaderBar';

interface ThreadViewProps {
    account: AccountAttributes | undefined;
    emails: EmailAttributes[];
    onReply?: (email: EmailAttributes) => void;
    onReplyAll?: (email: EmailAttributes) => void;
}

const ThreadView: React.FC<ThreadViewProps> = ({ emails, account, onReply, onReplyAll }) => {
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

    return (
        <div className="flex w-full flex-col px-4">
            {emails.map((email, index) => {
                const emailId = String(email._id);
                const isExpanded = expandedIds.has(emailId);

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
                        {isExpanded && <EmailBodyPreview html={email.bodyHtml} plain={email.bodyPlain} />}
                    </div>
                );
            })}
        </div>
    );
};

export default ThreadView;
