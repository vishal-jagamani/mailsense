'use client';

import { AlertCircle } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@shared/ui/button';
import {
    AccountActivityGrid,
    DashboardEmptyState,
    DashboardHeader,
    DashboardSkeleton,
    EmailVolumeChart,
    OverviewKpiCards,
    ResponseTimeCard,
    TopSendersCard,
} from '../components';
import AccountDistributionPieChart from '../components/account-distribution-pie-chart';
import { useDashboardPage } from '../hooks';

const DashboardPage: React.FC = () => {
    const { accounts, states, analytics, setters, actions } = useDashboardPage();
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

    const handleManualRefresh = async (): Promise<void> => {
        try {
            setIsRefreshing(true);
            await actions.handleRefresh();
        } catch (error) {
            console.error('Failed to manually refresh dashboard page', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    if (analytics.isLoading && !analytics.data) {
        return (
            <div className="h-full w-full overflow-y-auto p-4 pt-0">
                <DashboardSkeleton />
            </div>
        );
    }

    if (!accounts.isLoading && accounts.data.length === 0) {
        return (
            <div className="h-full w-full overflow-y-auto p-4 pt-0">
                <DashboardEmptyState />
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col overflow-y-auto p-4 pt-0">
            {/* Header with Account & Timeframe Filters */}
            <DashboardHeader
                accounts={accounts.data}
                selectedAccountId={states.selectedAccountId}
                selectedTimeframe={states.selectedTimeframe}
                timeframeOptions={states.timeframeOptions}
                isRefreshing={isRefreshing}
                onSelectAccountId={setters.setSelectedAccountId}
                onRefresh={handleManualRefresh}
            />

            <div className="space-y-4">
                {/* Error Banner (if fetch failed but previous cache exists) */}
                {analytics.error && (
                    <div className="border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/20 flex items-center justify-between rounded-xl border p-3.5 text-xs">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>Failed to fetch latest analytics data. Displaying cached snapshot.</span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleManualRefresh}
                            className="border-destructive/40 hover:bg-destructive/10 h-7 text-xs"
                        >
                            Retry
                        </Button>
                    </div>
                )}

                {/* 6 KPI Cards Overview Grid */}
                <OverviewKpiCards overview={analytics.data?.overview} isLoading={analytics.isLoading} />

                {/* 2-Column Responsive Grid for Volume Trends and Account Email Distribution */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <EmailVolumeChart volumeData={analytics.data?.volumeTrend} timeframe={states.selectedTimeframe} isLoading={analytics.isLoading} />
                    <AccountDistributionPieChart
                        accounts={analytics.data?.accountSummaries}
                        selectedAccountId={states.selectedAccountId}
                        isLoading={analytics.isLoading}
                    />
                </div>

                {/* 2-Column Responsive Grid for Turnaround and Top Senders */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <TopSendersCard senders={analytics.data?.topSenders} isLoading={analytics.isLoading} />
                    <ResponseTimeCard responseTime={analytics.data?.responseTime} isLoading={analytics.isLoading} />
                </div>

                {/* Connected Mailbox Activity Breakdown Grid */}
                <AccountActivityGrid accounts={analytics.data?.accountSummaries} isLoading={analytics.isLoading} />
            </div>
        </div>
    );
};

export default DashboardPage;
