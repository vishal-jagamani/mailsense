'use client';

import React, { Suspense } from 'react';

import APILoader from '@shared/components/apiLoader';
import Loader from '@shared/components/loader';
import { Separator } from '@shared/ui/separator';
import AttachmentList from '../components/attachments';
import EmailBodyPreview from '../components/EmailBodyPreview';
import EmailHeader from '../components/EmailHeader';
import EmailMenuBarOptions from '../components/EmailMenuBarOptions';
import ThreadView from '../components/thread-view';
import { useEmailsPage } from '../hooks';

interface EmailPageProps {
    account: string;
    email: string;
}

const EmailPage: React.FC<EmailPageProps> = ({ account, email }) => {
    const {
        account: { data: accountData, isLoadingAccount },
        email: { data: emailData, isLoadingEmail },
        thread: { data: threadData, isLoadingThread },
        unreadEmail: { unreadEmailLoading },
        setter: { setIsManualUnreadOperation },
    } = useEmailsPage(account, email);

    if (isLoadingAccount || isLoadingEmail || isLoadingThread) {
        return <Loader />;
    }

    return (
        <>
            <div className="flex h-full w-full px-4 py-2 pb-16 md:pb-12">
                <div className="bg-sidebar relative flex h-full w-full flex-col overflow-y-auto rounded-md">
                    <APILoader show={unreadEmailLoading} />
                    <EmailMenuBarOptions
                        accountId={account}
                        emailId={emailData?.providerMessageId || ''}
                        onManualUnreadOperation={() => setIsManualUnreadOperation(true)}
                    />
                    <Separator orientation="horizontal" />
                    <EmailHeader accountId={account} email={emailData} />
                    {threadData?.thread && threadData.thread.length > 1 ? (
                        <ThreadView account={accountData} emails={threadData.thread} />
                    ) : (
                        <>
                            <EmailBodyPreview html={emailData?.bodyHtml} plain={emailData?.bodyPlain} />
                            {emailData?.attachments && emailData.attachments.length > 0 && (
                                <AttachmentList emailId={String(emailData._id)} attachments={emailData.attachments} />
                            )}
                        </>
                    )}
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
