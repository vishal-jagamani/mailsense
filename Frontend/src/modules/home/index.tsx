'use client';

import Loader from '@/shared/components/loader';
import { EMAILS_PAGE_SIZE } from '@/shared/constants';
import { useAuthStore } from '@/store';
import { useState } from 'react';
import EmailListTable from './components/EmailListTable';
import { useFetchEmails } from './services/useHomeApi';

const HomePage = () => {
    const [page, setPage] = useState(1);
    const { user } = useAuthStore();
    const { data: emails, isLoading } = useFetchEmails(user?.id || '', !!user, { page, size: EMAILS_PAGE_SIZE });

    if (isLoading) {
        return <Loader />;
    }

    return (
        <div className="flex items-center justify-center gap-4 px-4 py-2">
            <div className="flex h-full w-full flex-col items-center justify-center gap-6 rounded-xl">
                <p>Emails</p>
                <EmailListTable data={emails?.data || []} page={page} />
            </div>
        </div>
    );
};

export default HomePage;
