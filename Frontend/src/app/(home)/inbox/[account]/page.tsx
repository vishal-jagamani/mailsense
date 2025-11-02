import AccountInboxPage from '@/modules/inbox/accountInbox';
import React from 'react';

const page = async ({ params }: { params: { account: string } }) => {
    const { account } = await params;
    return (
        <>
            <AccountInboxPage account={account} />
        </>
    );
};

export default page;
