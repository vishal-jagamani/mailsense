import {
    AccountActivitySummaryAttributes,
    AccountAttributes,
    ANALYTICS_TIMEFRAME,
    DashboardAnalyticsResponse,
    EmailVolumeDataPointAttributes,
    OverviewMetricsAttributes,
    ResponseTimeMetricsAttributes,
    TopSenderDataAttributes,
} from '@mailsense/types';
import { LucideIcon } from 'lucide-react';

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
    accounts: { data: AccountAttributes[]; isLoading: boolean };
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

export interface DashboardHeaderProps {
    accounts: AccountAttributes[];
    selectedAccountId: string;
    selectedTimeframe: ANALYTICS_TIMEFRAME;
    timeframeOptions: TimeframeOption[];
    isRefreshing: boolean;
    onSelectAccountId: (accountId: string) => void;
    onRefresh: () => Promise<void>;
}

export interface DashboardAccountFilterProps {
    accounts: AccountAttributes[];
    active: string;
    selectedAccountId: string;
    onSelectAccountId: (id: string) => void;
}

export interface DashboardHeaderActionBarProps {
    selectedTimeframe: ANALYTICS_TIMEFRAME;
    timeframeOptions: TimeframeOption[];
    isRefreshing: boolean;
    onSelectAccountId: (id: string) => void;
    handleRefreshClick: () => Promise<void>;
}

export interface UseDashboardHeaderResult {
    states: {
        activeAccountLabel: string;
    };
    actions: {
        handleAccountSelect: (accountId: string) => void;
        handleRefreshClick: () => Promise<void>;
    };
}

export interface MetricCardConfig {
    id: string;
    title: string;
    value: string | number;
    icon: LucideIcon;
    iconColor: string;
    iconBg: string;
    changePercentage?: number;
    subtitle?: string;
}

export interface OverviewKpiCardsProps {
    overview: OverviewMetricsAttributes | undefined;
    isLoading: boolean;
}

export interface EmailVolumeChartProps {
    volumeData: EmailVolumeDataPointAttributes[] | undefined;
    timeframe: ANALYTICS_TIMEFRAME;
    isLoading: boolean;
}

export interface ChartTooltipPayloadItem {
    name: string;
    value: number;
    color: string;
    dataKey: string;
}

export interface CustomVolumeTooltipProps {
    active?: boolean;
    payload?: ChartTooltipPayloadItem[];
    label?: string;
}

export interface ResponseTimeCardProps {
    responseTime: ResponseTimeMetricsAttributes | undefined;
    isLoading: boolean;
}

export interface ResponseDistributionBucket {
    label: string;
    count: number;
    percentage: number;
    colorClass: string;
    bgClass: string;
}

export interface TopSendersCardProps {
    senders: TopSenderDataAttributes[] | undefined;
    isLoading: boolean;
}

export interface AccountActivityGridProps {
    accounts: AccountActivitySummaryAttributes[] | undefined;
    isLoading: boolean;
}

export interface DashboardSkeletonProps {
    className?: string;
}

export interface DashboardEmptyStateProps {
    title?: string;
    description?: string;
    onConnectAccount?: () => void;
}

export interface AccountPieSliceData {
    name: string;
    emailAddress: string;
    value: number;
    provider: string;
    percentage: number;
    fill: string;
}

export interface AccountDistributionPieChartProps {
    accounts: AccountActivitySummaryAttributes[] | undefined;
    selectedAccountId?: string;
    isLoading: boolean;
}

export interface CustomPieTooltipPayloadItem {
    name: string;
    value: number;
    payload: AccountPieSliceData;
}

export interface CustomPieTooltipProps {
    active?: boolean;
    payload?: CustomPieTooltipPayloadItem[];
}

