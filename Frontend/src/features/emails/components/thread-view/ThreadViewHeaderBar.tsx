'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import React from 'react';

import { EmailAttributes } from '@mailsense/types';
import { getFormattedEmailTo } from '@shared/utils/emails';
import { formatDateToDateTimeAgoString } from '@shared/utils/formatter';

interface ThreadViewHeaderBarProps {
    emailId: string;
    email: EmailAttributes;
    toggleExpand: (emailId: string) => void;
    isExpanded: boolean;
    accountEmailAddress: string;
}

const ThreadViewHeaderBar: React.FC<ThreadViewHeaderBarProps> = ({ emailId, toggleExpand, email, isExpanded, accountEmailAddress }) => {
    return (
        <div onClick={() => toggleExpand(emailId)} className="flex cursor-pointer items-center justify-between py-4 transition-colors select-none">
            <div className="flex items-center gap-3">
                <button className="text-gray-500 hover:text-gray-700">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>

                <div className="flex h-8 w-8 flex-col items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    {(email.from || 'U').charAt(0).toUpperCase()}
                </div>

                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{email.from}</span>
                    {isExpanded && <p className="text-xs text-gray-500">To: {getFormattedEmailTo(email.to, accountEmailAddress)}</p>}
                    {!isExpanded && (
                        <>
                            <span className="max-w-md truncate text-xs text-gray-500">{email.bodyPlain || 'No content preview'}</span>
                        </>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">{formatDateToDateTimeAgoString(email.receivedAt)}</span>
            </div>
        </div>
    );
};

export default ThreadViewHeaderBar;
