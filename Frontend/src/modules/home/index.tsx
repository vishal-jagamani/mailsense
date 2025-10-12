'use client';

import Loader from '@/shared/components/loader';
import EmailListTable from './components/EmailListTable';
import { useFetchEmails } from './services/useHomeApi';

const HomePage = () => {
    const { data: emails, isLoading } = useFetchEmails();

    if (isLoading) {
        return <Loader />;
    }

    return (
        <div className="flex items-center justify-center gap-4 px-4 py-2">
            <div className="flex h-full w-full flex-col items-center justify-center gap-6 rounded-xl border border-gray-400">
                <p>Emails</p>
                <EmailListTable data={emails?.data || []} />
            </div>
        </div>
    );
};

export default HomePage;
