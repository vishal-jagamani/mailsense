import { AnalyticsQueryParams, DashboardAnalyticsResponse } from '@mailsense/types';
import { ANALYTICS_QUERY_KEYS } from '@shared/api';
import { ANALYTICS_STALE_TIME_MS } from '@shared/constants';
import { trackUserAction } from '@shared/monitoring';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { fetchDashboardAnalytics } from './analytics.api';

export const useGetDashboardAnalyticsQuery = (
    params?: AnalyticsQueryParams,
    enabled: boolean = true,
): UseQueryResult<DashboardAnalyticsResponse, Error> => {
    try {
        return useQuery<DashboardAnalyticsResponse, Error>({
            queryKey: ANALYTICS_QUERY_KEYS.dashboard(params),
            queryFn: async () => fetchDashboardAnalytics(params),
            enabled,
            staleTime: ANALYTICS_STALE_TIME_MS,
            refetchOnWindowFocus: true,
        });
    } catch (error) {
        trackUserAction('ui.click', 'Failed to initialize useGetDashboardAnalyticsQuery hook');
        throw error;
    }
};
