'use client';

import React from 'react';
import EmailListTable from '../home/components/EmailListTable';
import { useFetchEmails } from '../home/services/useHomeApi';
import { useAuthStore } from '@/store';

const InboxPage: React.FC = () => {
    const { user } = useAuthStore();
    const { data: emails } = useFetchEmails(user?.id || '', !!user);

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
