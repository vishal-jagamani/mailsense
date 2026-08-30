import { ChartSeriesConfig, TimeframeOption } from '@features/analytics/types';
import { ANALYTICS_TIMEFRAME } from '@mailsense/types';

export const TIMEFRAME_OPTIONS: TimeframeOption[] = [
    { label: 'Today', value: ANALYTICS_TIMEFRAME.TODAY },
    { label: '7D', value: ANALYTICS_TIMEFRAME.SEVEN_DAYS },
    { label: '30D', value: ANALYTICS_TIMEFRAME.THIRTY_DAYS },
    { label: '90D', value: ANALYTICS_TIMEFRAME.NINETY_DAYS },
    { label: 'This Month', value: ANALYTICS_TIMEFRAME.THIS_MONTH },
    { label: '1Y', value: ANALYTICS_TIMEFRAME.ONE_YEAR },
    { label: 'All Time', value: ANALYTICS_TIMEFRAME.ALL_TIME },
];

export const DEFAULT_ANALYTICS_TIMEFRAME: ANALYTICS_TIMEFRAME = ANALYTICS_TIMEFRAME.THIRTY_DAYS;

export const ALL_ACCOUNTS_FILTER_ID: string = 'all';

export const ANALYTICS_STALE_TIME_MS: number = 60000; // 1 minute stale time

export const VOLUME_CHART_SERIES: { RECEIVED: ChartSeriesConfig; SENT: ChartSeriesConfig } = {
    RECEIVED: {
        key: 'receivedCount',
        label: 'Received',
        strokeColor: '#6366f1',
        fillColor: '#818cf8',
    },
    SENT: {
        key: 'sentCount',
        label: 'Sent',
        strokeColor: '#10b981',
        fillColor: '#34d399',
    },
};
