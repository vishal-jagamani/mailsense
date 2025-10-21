import AccountInboxPage from '@/modules/inbox/accountInbox';
import React from 'react';

const page: React.FC<{ params: { account: string } }> = ({ params }) => {
    return (
        <>
            <AccountInboxPage account={params.account} />
        </>
    );
};

export default page;
