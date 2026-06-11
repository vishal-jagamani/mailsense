import React from 'react';

import InboxPageWrapper from '@features/inbox/pages';

const page: React.FC = () => {
    return (
        <React.Suspense fallback={null}>
            <InboxPageWrapper />
        </React.Suspense>
    );
};

export default page;
