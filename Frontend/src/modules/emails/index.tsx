'use client';

import { HOME_ROUTES } from '@/shared/constants/routes';
import { useBreadcrumbStore } from '@/shared/store/breadcrumb.store';
import React, { useEffect } from 'react';
import { useGetAccountDetailsQuery } from '../accounts/services/useAccountApi';
import EmailBodyPreview from './components/EmailBodyPreview';
import { useGetEmailDetailsQuery } from './services/useEmailApi';
import EmailMenuBarOptions from './components/EmailMenuBarOptions';

interface EmailPageProps {
    account: string;
    email: string;
}

const EmailPage: React.FC<EmailPageProps> = ({ account, email }) => {
    const { data: accountData } = useGetAccountDetailsQuery(account, { enabled: !!account });
    const { data: emailData } = useGetEmailDetailsQuery(email, { enabled: !!email });

    useEffect(() => {
        if (emailData && accountData) {
            useBreadcrumbStore.setState({
                items: [
                    { title: 'Inbox', url: HOME_ROUTES.UNIFIED_INBOX },
                    { title: accountData?.emailAddress || '', url: HOME_ROUTES.ACCOUNT_INBOX(accountData?._id) },
                    { title: emailData?.subject || '', url: HOME_ROUTES.EMAIL(accountData?._id, emailData?._id) },
                ],
            });
        }
    }, [emailData, accountData]);

    return (
        <>
            {/* <div>x`
                Account: {account}, {accountData?.emailAddress}
            </div>
            <div>Email: {email}</div> */}
            <div className="mt-8 flex px-4 py-2">
                <div className="flex flex-col rounded-t-md bg-neutral-900">
                    <EmailMenuBarOptions accountId={account} emailId={email} />
                    <EmailBodyPreview html={emailData?.bodyHtml} plain={emailData?.bodyPlain} />
                </div>
            </div>
        </>
    );
};

export default EmailPage;
