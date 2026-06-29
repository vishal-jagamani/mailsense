'use client';

import React from 'react';

import { AccountAttributes, AccountProviderIcon } from '@entities/account';
import AccountCardActionButtons from './AccountCardActionButtons';

interface AccountCardProps {
    account: AccountAttributes;
}

const AccountCard: React.FC<AccountCardProps> = ({ account }) => {
    return (
        <>
            <div className="bg-card flex size-2 h-16 w-full items-center justify-center rounded-xl border p-4 md:w-fit md:max-w-fit">
                <div className="flex w-full items-center gap-2">
                    <div className="flex items-center">
                        <AccountProviderIcon provider={account.provider} className="h-10 w-14" />
                    </div>
                    <AccountCardActionButtons account={account} />
                </div>
            </div>
        </>
    );
};

export default AccountCard;
