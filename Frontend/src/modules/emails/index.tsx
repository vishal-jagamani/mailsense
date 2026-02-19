'use client';

import APILoader from '@/shared/components/apiLoader';
import Loader from '@/shared/components/loader';
import { HOME_ROUTES } from '@/shared/constants/routes';
import { useBreadcrumbStore } from '@/shared/constants/store/breadcrumb.store';
import { Separator } from '@/shared/ui/separator';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useGetAccountDetailsQuery } from '../accounts/services/useAccountApi';
import EmailBodyPreview from './components/EmailBodyPreview';
import EmailHeader from './components/EmailHeader';
import EmailMenuBarOptions from './components/EmailMenuBarOptions';
import { useGetEmailDetailsQuery, useUnreadEmailMutation } from './services/useEmailApi';

interface EmailPageProps {
    account: string;
    email: string;
}

const EmailPage: React.FC<EmailPageProps> = ({ account, email }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const page = searchParams.get('page');

    const [hasMarkedAsRead, setHasMarkedAsRead] = useState<boolean>(false);
    const [isManualUnreadOperation, setIsManualUnreadOperation] = useState<boolean>(false);

    const { data: accountData, isLoading: isLoadingAccount } = useGetAccountDetailsQuery(account, { enabled: !!account });
    const { data: emailData, isLoading: isLoadingEmail } = useGetEmailDetailsQuery(email, { enabled: !!email });
    const { mutate: unreadEmail, isPending: unreadEmailLoading, data: unreadEmailSuccess, error: unreadEmailError } = useUnreadEmailMutation();

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

    useEffect(() => {
        const updateEmailStatus = async () => {
            if (emailData && accountData && !emailData.isRead && !hasMarkedAsRead) {
                unreadEmail({ emailIds: [emailData?.providerMessageId], unread: false });
                setHasMarkedAsRead(true);
            }
        };
        updateEmailStatus();
    }, [emailData, accountData]);

    useEffect(() => {
        if (unreadEmailSuccess && isManualUnreadOperation) {
            router.push(`${HOME_ROUTES.UNIFIED_INBOX}?page=${page}`);
        }
    }, [emailData, unreadEmailSuccess, isManualUnreadOperation]);

    if (isLoadingAccount || isLoadingEmail) {
        return <Loader />;
    }

    return (
        <>
            <div className="flex h-full w-full px-4 py-2 pb-12">
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

export default EmailPage;
