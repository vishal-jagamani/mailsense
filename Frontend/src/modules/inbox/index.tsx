'use client';

import { useBreadcrumbStore } from '@/shared/store/breadcrumb.store';
import { useAuthStore } from '@/store';
import React, { useEffect } from 'react';
import EmailListTable from '../home/components/EmailListTable';
import { useFetchEmails } from '../home/services/useHomeApi';
import Loader from '@/shared/components/loader';

const InboxPage: React.FC = () => {
    const { user } = useAuthStore();
    const { data: emails, refetch: refetchEmails, isLoading: isLoadingEmails } = useFetchEmails(user?.id || '', !!user);

    useEffect(() => {
        if (user) {
            refetchEmails();
        }
    }, [user, refetchEmails]);

    useEffect(() => {
        useBreadcrumbStore.setState({ items: [{ title: 'Inbox', url: '/inbox' }] });
    }, []);

    if (isLoadingEmails) {
        return <Loader />;
    }

    return (
        <>
            <div className="flex items-center justify-center gap-4 px-4 py-2">
                <div className="flex h-full w-full flex-col items-center justify-center gap-6 rounded-xl">
                    <p>Emails</p>
                    <EmailListTable data={emails?.data || []} />
                </div>
            </div>
        </>
    );
};

export default InboxPage;
