import React from 'react';

import AccountInboxPage from '@modules/inbox/accountInbox';

const page = async ({ params }: { params: { account: string } }) => {
    const { account } = await params;
    return (
        <React.Suspense fallback={null}>
            <AccountInboxPage account={account} />
        </React.Suspense>
    );
};

export default page;
