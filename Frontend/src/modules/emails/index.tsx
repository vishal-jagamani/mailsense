'use client';

import { HOME_ROUTES } from '@/shared/constants/routes';
import { useBreadcrumbStore } from '@/shared/store/breadcrumb.store';
import React, { useEffect } from 'react';
import { useGetAccountDetailsQuery } from '../accounts/services/useAccountApi';
import EmailBodyPreview from './components/EmailBodyPreview';
import { useGetEmailDetailsQuery } from './services/useEmailApi';
import EmailMenuBarOptions from './components/EmailMenuBarOptions';
import Loader from '@/shared/components/loader';
import EmailHeader from './components/EmailHeader';
import { Separator } from '@/shared/ui/separator';

interface EmailPageProps {
    account: string;
    email: string;
}

const EmailPage: React.FC<EmailPageProps> = ({ account, email }) => {
    const { data: accountData, isLoading: isLoadingAccount } = useGetAccountDetailsQuery(account, { enabled: !!account });
    const { data: emailData, isLoading: isLoadingEmail } = useGetEmailDetailsQuery(email, { enabled: !!email });

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

    if (isLoadingAccount || isLoadingEmail) {
        return <Loader />;
    }

    return (
        <>
            <div className="flex h-full w-full px-4 py-2 pb-12">
                <div className="bg-sidebar relative flex h-full w-full flex-col overflow-hidden rounded-md">
                    <EmailMenuBarOptions accountId={account} emailId={email} />
                    <Separator orientation="horizontal" />
                    <EmailHeader accountId={account} email={emailData} />
                    <EmailBodyPreview html={emailData?.bodyHtml} plain={emailData?.bodyPlain} />
                </div>
            </div>
        </>
    );
};

export default EmailPage;
