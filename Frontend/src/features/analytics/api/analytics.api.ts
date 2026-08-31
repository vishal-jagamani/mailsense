import { AnalyticsQueryParams, APIResponse, DashboardAnalyticsResponse } from '@mailsense/types';
import { ANALYTICS_API_ENDPOINTS, axiosClient } from '@shared/api';

export async function fetchDashboardAnalytics(params?: AnalyticsQueryParams): Promise<DashboardAnalyticsResponse> {
    const { data } = await axiosClient.get<APIResponse<DashboardAnalyticsResponse>>(ANALYTICS_API_ENDPOINTS.DASHBOARD, {
        params,
    });
    return data.data;
}
