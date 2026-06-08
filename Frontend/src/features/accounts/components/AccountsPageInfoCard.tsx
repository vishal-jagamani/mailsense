'use client';

import React from 'react';

import { MESSAGES } from '@shared/constants';

const AccountsPageInfoCard: React.FC = () => {
    return (
        <>
            <div className="bg-sidebar flex flex-col gap-4 rounded-xl border p-4 text-center md:p-10 md:py-4">
                <div className="flex flex-col items-center justify-center gap-0">
                    <p className="text-md font-semibold">{MESSAGES.ACCOUNTS.INFO_CARD.TITLE}</p>
                    <p className="text-sm">{MESSAGES.ACCOUNTS.INFO_CARD.DESCRIPTION}</p>
                </div>
                <div className="flex items-center justify-center">
                    <p className="text-sm">{MESSAGES.ACCOUNTS.INFO_CARD.GET_STARTED}</p>
                </div>
            </div>
        </>
    );
};

export default AccountsPageInfoCard;
