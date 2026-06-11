import React from 'react';

import AccountInboxPageWrapper from '@features/inbox/pages/account-inbox';

const page = async ({ params }: { params: { account: string } }) => {
    const { account } = await params;
    return (
        <React.Suspense fallback={null}>
            <AccountInboxPageWrapper account={account} />
        </React.Suspense>
    );
};

export default page;
