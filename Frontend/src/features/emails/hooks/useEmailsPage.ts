import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useGetAccountDetailsQuery } from '@features/accounts/api/accounts.queries';
import { HOME_ROUTES } from '@shared/constants';
import { useBreadcrumbStore } from '@shared/store';
import { useUnreadEmailMutation } from '../api/email.mutations';
import { useGetEmailDetailsQuery } from '../api/email.queries';
import { UpdateAPIResponse, EmailAttributes } from '@mailsense/types';

interface useEmailsPageReturnParams {
    account: {
        isLoadingAccount: boolean;
    };
    email: {
        data: EmailAttributes | undefined;
        isLoadingEmail: boolean;
    };
    unreadEmail: {
        trigger: (emailIds: string[], unread: boolean) => void;
        unreadEmailLoading: boolean;
        unreadEmailSuccess: UpdateAPIResponse | undefined;
    };
    setter: {
        setIsManualUnreadOperation: (value: boolean) => void;
    };
}

export const useEmailsPage = (accountId: string, emailId: string): useEmailsPageReturnParams => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const page = searchParams.get('page');

    const [hasMarkedAsRead, setHasMarkedAsRead] = useState<boolean>(false);
    const [isManualUnreadOperation, setIsManualUnreadOperation] = useState<boolean>(false);

    const { data: accountData, isLoading: isLoadingAccount } = useGetAccountDetailsQuery(accountId, { enabled: !!accountId });
    const { data: emailData, isLoading: isLoadingEmail } = useGetEmailDetailsQuery(emailId, { enabled: !!emailId });
    const { mutate: unreadEmail, isPending: unreadEmailLoading, data: unreadEmailSuccess } = useUnreadEmailMutation();

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
    }, [emailData, accountData, hasMarkedAsRead]);

    useEffect(() => {
        if (unreadEmailSuccess && isManualUnreadOperation) {
            router.push(`${HOME_ROUTES.UNIFIED_INBOX}?page=${page}`);
        }
    }, [emailData, unreadEmailSuccess, isManualUnreadOperation, page, router]);

    return {
        account: { isLoadingAccount },
        email: { data: emailData, isLoadingEmail },
        unreadEmail: {
            trigger: (emailIds: string[], unread: boolean) => unreadEmail({ emailIds, unread }),
            unreadEmailLoading,
            unreadEmailSuccess,
        },
        setter: { setIsManualUnreadOperation },
    };
};
