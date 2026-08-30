import { AccountAttributes, ANALYTICS_TIMEFRAME, DashboardAnalyticsResponse } from '@mailsense/types';

export interface TimeframeOption {
    label: string;
    value: ANALYTICS_TIMEFRAME;
}

export interface UseDashboardParams {
    initialAccountId?: string;
    initialTimeframe?: ANALYTICS_TIMEFRAME;
}

export interface CustomDateRangeState {
    startDate: string;
    endDate: string;
}

export interface ChartSeriesConfig {
    key: string;
    label: string;
    strokeColor: string;
    fillColor: string;
}

export interface UseDashboardPageResult {
    accounts: { data: AccountAttributes[] };
    states: {
        selectedAccountId: string;
        selectedTimeframe: ANALYTICS_TIMEFRAME;
        customDateRange: CustomDateRangeState;
        timeframeOptions: TimeframeOption[];
    };
    analytics: { data: DashboardAnalyticsResponse | undefined; isLoading: boolean; error: Error | null };
    setters: {
        setSelectedAccountId: (accountId: string) => void;
        setSelectedTimeframe: (timeframe: ANALYTICS_TIMEFRAME) => void;
        setCustomDateRange: (startDate: string, endDate: string) => void;
    };
    actions: { handleRefresh: () => Promise<void> };
}
