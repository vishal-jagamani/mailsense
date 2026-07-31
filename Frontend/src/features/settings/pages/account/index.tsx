'use client';

import React from 'react';

import ConnectedAccountsStatus from '@features/settings/components/account/ConnectedAccountsStatus';
import GlobalBackgroundSyncSettings from '@features/settings/components/account/GlobalBackgroundSyncSettings';
import { useAccountSettings } from '@features/settings/hooks/useAccountSettings';
import Loader from '@shared/components/loader';

const AccountSettings: React.FC = () => {
    const {
        data: { syncSettings },
        userSettings: { isLoading: isLoadingSettings },
        accounts: { data: accounts, isLoading: isLoadingAccounts },
        actions: { handleGlobalAutoSyncToggle, handleSyncModeChange, handleGlobalIntervalChange },
    } = useAccountSettings();

    if (isLoadingSettings || isLoadingAccounts) {
        return <Loader />;
    }

    return (
        <div className="space-y-2 select-none">
            {/* Global Settings Card */}
            <GlobalBackgroundSyncSettings
                syncSettings={syncSettings}
                handleGlobalAutoSyncToggle={handleGlobalAutoSyncToggle}
                handleSyncModeChange={handleSyncModeChange}
                handleGlobalIntervalChange={handleGlobalIntervalChange}
            />
            {/* Connected Accounts Card */}
            <ConnectedAccountsStatus accounts={accounts} />
        </div>
    );
};

export default AccountSettings;
