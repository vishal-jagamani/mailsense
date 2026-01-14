'use client';

import { Email } from '@/shared/types/email.types';
import { formatDateToDateTimeAgoString } from '@/shared/utils/formatter';
import React from 'react';
import { formatEmailFromString } from '../utils/formatter';

interface EmailHeaderProps {
    accountId: string;
    email?: Email;
}

const EmailHeader: React.FC<EmailHeaderProps> = ({ email }) => {
    return (
        <>
            <div className="bg-sidebar sticky top-10 z-30 flex flex-col justify-center gap-1 p-1 px-4 pb-2">
                <p className="text-2xl font-light">{email?.subject}</p>
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{formatEmailFromString(email?.from || '')}</p>
                    <p className="text-sm font-light">{email?.receivedAt ? formatDateToDateTimeAgoString(email?.receivedAt) : ''}</p>
                </div>
            </div>
        </>
    );
};

export default EmailHeader;
