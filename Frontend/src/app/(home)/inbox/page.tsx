import InboxPage from '@/modules/inbox';
import React from 'react';

const page: React.FC = () => {
    return (
        <React.Suspense fallback={null}>
            <InboxPage />
        </React.Suspense>
    );
};

export default page;
