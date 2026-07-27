'use client';

import React from 'react';

import { formatEmailFromString } from '@entities/email/lib';
import { EmailAttributes } from '@mailsense/types';
import { formatDateToDateTimeAgoString } from '@shared/utils/formatter';

interface EmailHeaderProps {
    accountId: string;
    email?: EmailAttributes;
}

const EmailHeader: React.FC<EmailHeaderProps> = ({ email }) => {
    return (
        <>
            <div className="bg-sidebar sticky top-10 z-30 flex flex-col justify-center gap-2 p-1 px-4 pb-2">
                <p className="text-lg font-light md:text-2xl">{email?.subject}</p>
                <div className="flex flex-wrap items-center justify-between md:flex-nowrap">
                    <p className="text-xs font-semibold md:text-sm">{formatEmailFromString(email?.from || '')}</p>
                    <p className="text-xs font-light text-nowrap md:text-sm">
                        {email?.receivedAt ? formatDateToDateTimeAgoString(email?.receivedAt) : ''}
                    </p>
                </div>
            </div>
        </>
    );
};

export default EmailHeader;
