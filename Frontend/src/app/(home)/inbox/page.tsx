import React from 'react';

import InboxPage from '@modules/inbox';

const page: React.FC = () => {
    return (
        <React.Suspense fallback={null}>
            <InboxPage />
        </React.Suspense>
    );
};

export default page;
