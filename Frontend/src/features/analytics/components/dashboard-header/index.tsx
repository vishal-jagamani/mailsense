'use client';

import React, { useMemo } from 'react';

import { ALL_ACCOUNTS_FILTER_ID, DASHBOARD_LABELS } from '@shared/constants';
import { DashboardHeaderProps } from '../../types';
import DashboardAccountFilterDropdown from './AccountFilterDropdown';
import DashboardHeaderActionBar from './DashboardHeaderActionBar';
import { useIsMobile } from '@shared/hooks';

export const DashboardHeader: React.FC<DashboardHeaderProps> = (props) => {
    const isMobile = useIsMobile();
    const { selectedAccountId, onSelectAccountId, onRefresh, accounts, selectedTimeframe, timeframeOptions, isRefreshing } = props;

    const activeAccountLabel: string = useMemo(() => {
        if (selectedAccountId === ALL_ACCOUNTS_FILTER_ID) {
            return 'All Connected Accounts';
        }
        const foundAccount = accounts.find((account) => account._id === selectedAccountId);
        return foundAccount ? foundAccount.emailAddress : 'All Connected Accounts';
    }, [accounts, selectedAccountId]);

    const handleRefreshClick = async (): Promise<void> => {
        await onRefresh();
    };

    return (
        <div className="bg-background sticky top-0 z-10 flex w-full flex-col gap-2 pb-4 select-none md:flex-row md:items-center md:justify-between">
            {isMobile ? (
                <>
                    {/* Header Title and Description */}
                    <div className="flex justify-between items-center">
                        <h1 className="text-foreground text-xl font-bold tracking-tight">{DASHBOARD_LABELS.LABEL}</h1>
                        {/* <p className="text-muted-foreground text-xs">{DASHBOARD_LABELS.DESCRIPTION}</p> */}
                        {/* Mailbox Selector Dropdown */}
                        <DashboardAccountFilterDropdown
                            accounts={accounts}
                            active={activeAccountLabel}
                            selectedAccountId={selectedAccountId}
                            onSelectAccountId={onSelectAccountId}
                        />
                    </div>
                    {/* Account Selector and Action Buttons */}
                    <div className="flex items-center gap-2.5">
                        {/* Dashboard Header Action Bar */}
                        <DashboardHeaderActionBar
                            selectedTimeframe={selectedTimeframe}
                            timeframeOptions={timeframeOptions}
                            isRefreshing={isRefreshing}
                            onSelectAccountId={onSelectAccountId}
                            handleRefreshClick={handleRefreshClick}
                        />
                    </div>
                </>
            ) : (
                <>
                    {/* Header Title and Description */}
                    <div className="flex flex-col">
                        <h1 className="text-foreground text-xl font-bold tracking-tight">{DASHBOARD_LABELS.LABEL}</h1>
                        <p className="text-muted-foreground text-xs">{DASHBOARD_LABELS.DESCRIPTION}</p>
                    </div>

                    {/* Account Selector and Action Buttons */}
                    <div className="flex items-center gap-2.5">
                        {/* Mailbox Selector Dropdown */}
                        <DashboardAccountFilterDropdown
                            accounts={accounts}
                            active={activeAccountLabel}
                            selectedAccountId={selectedAccountId}
                            onSelectAccountId={onSelectAccountId}
                        />

                        {/* Dashboard Header Action Bar */}
                        <DashboardHeaderActionBar
                            selectedTimeframe={selectedTimeframe}
                            timeframeOptions={timeframeOptions}
                            isRefreshing={isRefreshing}
                            onSelectAccountId={onSelectAccountId}
                            handleRefreshClick={handleRefreshClick}
                        />
                    </div>
                </>
            )}
        </div>
    );
};
