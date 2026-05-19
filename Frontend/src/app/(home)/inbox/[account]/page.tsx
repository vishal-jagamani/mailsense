import AccountInboxPage from '@/modules/inbox/accountInbox';
import React from 'react';

const page = async ({ params }: { params: { account: string } }) => {
    const { account } = await params;
    return (
        <React.Suspense fallback={null}>
            <AccountInboxPage account={account} />
        </React.Suspense>
    );
};

export default page;
