'use client';

import React, { Suspense } from 'react';

import APILoader from '@shared/components/apiLoader';
import Loader from '@shared/components/loader';
import { Separator } from '@shared/ui/separator';
import EmailBodyPreview from '../components/EmailBodyPreview';
import EmailHeader from '../components/EmailHeader';
import EmailMenuBarOptions from '../components/EmailMenuBarOptions';
import { useEmailsPage } from '../hooks';

interface EmailPageProps {
    account: string;
    email: string;
}

const EmailPage: React.FC<EmailPageProps> = ({ account, email }) => {
    const {
        account: { isLoadingAccount },
        email: { data: emailData, isLoadingEmail },
        unreadEmail: { unreadEmailLoading },
        setter: { setIsManualUnreadOperation },
    } = useEmailsPage(account, email);

    if (isLoadingAccount || isLoadingEmail) {
        return <Loader />;
    }

    return (
        <>
            <div className="flex h-full w-full px-4 py-2 pb-16 md:pb-12">
                <div className="bg-sidebar relative flex h-full w-full flex-col overflow-hidden rounded-md">
                    <APILoader show={unreadEmailLoading} />
                    <EmailMenuBarOptions
                        accountId={account}
                        emailId={emailData?.providerMessageId || ''}
                        onManualUnreadOperation={() => setIsManualUnreadOperation(true)}
                    />
                    <Separator orientation="horizontal" />
                    <EmailHeader accountId={account} email={emailData} />
                    <EmailBodyPreview html={emailData?.bodyHtml} plain={emailData?.bodyPlain} />
                </div>
            </div>
        </>
    );
};

const EmailPageWrapper: React.FC<EmailPageProps> = (props) => (
    <Suspense fallback={<Loader />}>
        <EmailPage {...props} />
    </Suspense>
);

export default EmailPageWrapper;
