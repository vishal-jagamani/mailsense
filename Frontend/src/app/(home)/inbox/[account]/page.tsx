import React from 'react';

import AccountInboxPageWrapper from '@features/inbox/pages/account-inbox';
import { AccountsPageParams } from '@shared/types';

const page = async ({ params }: AccountsPageParams) => {
    const { account } = await params;
    return (
        <React.Suspense fallback={null}>
            <AccountInboxPageWrapper account={account} />
        </React.Suspense>
    );
};

export default page;
