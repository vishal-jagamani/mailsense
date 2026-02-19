'use client';

import ProviderAccountList from '@/modules/accounts/components/ProviderAccountList';
import { ROUTES } from '@/shared/constants';
import { useBreadcrumbStore } from '@/shared/constants/store/breadcrumb.store';
import React, { useEffect } from 'react';

const AccountSettings: React.FC = () => {
    useEffect(() => {
        useBreadcrumbStore.setState({
            items: [{ title: 'Settings', url: ROUTES.SETTINGS }],
        });
    }, []);
    return (
        <>
            <ProviderAccountList />
        </>
    );
};

export default AccountSettings;
