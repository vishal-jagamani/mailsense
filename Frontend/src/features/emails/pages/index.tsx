'use client';

import React, { Suspense } from 'react';

import { SuggestedReplyItem } from '@mailsense/types';
import APILoader from '@shared/components/apiLoader';
import Loader from '@shared/components/loader';
import { useComposeEmailPopupStore } from '@shared/store';
import { EmailPageProps } from '@shared/types';
import { Separator } from '@shared/ui/separator';
import AttachmentList from '../components/attachments';
import EmailAiSummaryCard from '../components/ai/EmailAiSummaryCard';
import EmailBodyPreview from '../components/EmailBodyPreview';
import EmailHeader from '../components/EmailHeader';
import EmailMenuBarOptions from '../components/EmailMenuBarOptions';
import SuggestedRepliesBar from '../components/ai/SuggestedRepliesBar';
import ThreadView from '../components/thread-view';
import { useEmailsPage } from '../hooks';

const EmailPage: React.FC<EmailPageProps> = ({ account, email }) => {
    const { openCompose } = useComposeEmailPopupStore();

    const {
        account: { data: accountData, isLoadingAccount },
        email: { data: emailData, isLoadingEmail },
        thread: { data: threadData, isLoadingThread },
        unreadEmail: { unreadEmailLoading },
        setter: { setIsManualUnreadOperation },
    } = useEmailsPage(account, email);

    // eslint-disable-next-line unused-imports/no-unused-vars
    const handleSelectReply = (reply: SuggestedReplyItem) => {
        openCompose();
    };

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
                        emailId={emailData?._id || ''}
                        onManualUnreadOperation={() => setIsManualUnreadOperation(true)}
                    />
                    <Separator orientation="horizontal" />
                    <EmailHeader accountId={account} email={emailData} />
                    {threadData?.thread && threadData.thread.length > 1 ? (
                        <ThreadView account={accountData} emails={threadData.thread} />
                    ) : (
                        <>
                            <div className="flex w-full flex-col px-4">
                                <EmailAiSummaryCard emailId={String(emailData?._id)} initialSummary={emailData?.aiSummary} />
                            </div>
                            <EmailBodyPreview html={emailData?.bodyHtml} plain={emailData?.bodyPlain} />
                            {emailData?.attachments && emailData.attachments.length > 0 && (
                                <AttachmentList emailId={String(emailData._id)} attachments={emailData.attachments} />
                            )}

                            {emailData?.from?.toLowerCase()?.includes('noreply') && (
                                <div className="flex w-full flex-col px-4">
                                    <SuggestedRepliesBar emailId={String(emailData?._id)} onSelectReply={handleSelectReply} />
                                </div>
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
