import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useGetAccountsQuery } from '@features/accounts/api/accounts.queries';
import { AccountAttributes, ANALYTICS_TIMEFRAME, AnalyticsQueryParams } from '@mailsense/types';
import { ALL_ACCOUNTS_FILTER_ID, DEFAULT_ANALYTICS_TIMEFRAME, HOME_ROUTES, TIMEFRAME_OPTIONS } from '@shared/constants';
import { useAuthStore, useBreadcrumbStore } from '@shared/store';
import { useGetDashboardAnalyticsQuery } from '../api/analytics.queries';
import { CustomDateRangeState, UseDashboardPageResult, UseDashboardParams } from '../types';

export const useDashboardPage = (params?: UseDashboardParams): UseDashboardPageResult => {
    const currentUser = useAuthStore((state) => state.user);
    const isAuthLoading = useAuthStore((state) => state.isLoading);

    const [selectedAccountId, setSelectedAccountId] = useState<string>(params?.initialAccountId ?? ALL_ACCOUNTS_FILTER_ID);
    const [selectedTimeframe, setSelectedTimeframe] = useState<ANALYTICS_TIMEFRAME>(params?.initialTimeframe ?? DEFAULT_ANALYTICS_TIMEFRAME);
    const [customDateRange, setCustomDateRangeState] = useState<CustomDateRangeState>({ startDate: '', endDate: '' });

    // Fetch user connected accounts
    const { data: accountsData, isLoading: isAccountsLoading } = useGetAccountsQuery(currentUser?.id || '', {
        enabled: Boolean(currentUser?.id),
    });

    // Filter for active mailboxes
    const activeAccounts: AccountAttributes[] = useMemo(() => {
        if (!accountsData || !Array.isArray(accountsData)) {
            return [];
        }
        return accountsData.filter((account) => account.active);
    }, [accountsData]);

    // Construct strongly-typed query parameters for analytics API
    const queryParams: AnalyticsQueryParams = useMemo(() => {
        const query: AnalyticsQueryParams = {
            timeframe: selectedTimeframe,
        };

        if (selectedAccountId !== ALL_ACCOUNTS_FILTER_ID) {
            query.accountId = selectedAccountId;
        }

        if (selectedTimeframe === ANALYTICS_TIMEFRAME.CUSTOM) {
            if (customDateRange.startDate) {
                query.startDate = customDateRange.startDate;
            }
            if (customDateRange.endDate) {
                query.endDate = customDateRange.endDate;
            }
        }

        return query;
    }, [selectedAccountId, selectedTimeframe, customDateRange]);

    // Fetch dashboard analytics data via React Query
    const {
        data: analyticsData,
        isLoading: analyticsDataLoading,
        error: analyticsDataError,
        refetch: refetchAnalytics,
    } = useGetDashboardAnalyticsQuery(queryParams, Boolean(currentUser?.id && activeAccounts.length > 0));

    const isInitialLoading = isAuthLoading || !currentUser?.id || isAccountsLoading || (activeAccounts.length > 0 && analyticsDataLoading && !analyticsData);

    const handleSetSelectedAccountId = (accountId: string): void => {
        setSelectedAccountId(accountId);
    };

    const handleSetSelectedTimeframe = (timeframe: ANALYTICS_TIMEFRAME): void => {
        setSelectedTimeframe(timeframe);
    };

    const handleSetCustomDateRange = (startDate: string, endDate: string): void => {
        setCustomDateRangeState({ startDate, endDate });
    };

    const handleRefresh = async (): Promise<void> => {
        try {
            await refetchAnalytics();
            toast.success('Dashboard analytics refreshed');
        } catch (refreshError) {
            console.error('Failed to refresh dashboard analytics', refreshError);
            toast.error('Failed to refresh analytics');
        }
    };

    return {
        accounts: { data: activeAccounts, isLoading: isAccountsLoading },
        analytics: { data: analyticsData, isLoading: isInitialLoading, error: analyticsDataError },
        states: { selectedAccountId, selectedTimeframe, customDateRange, timeframeOptions: TIMEFRAME_OPTIONS },
        setters: {
            setSelectedAccountId: handleSetSelectedAccountId,
            setSelectedTimeframe: handleSetSelectedTimeframe,
            setCustomDateRange: handleSetCustomDateRange,
        },
        actions: { handleRefresh },
    };
};
