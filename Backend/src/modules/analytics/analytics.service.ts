import {
    ANALYTICS_TIMEFRAME,
    AnalyticsQueryParams,
    DashboardAnalyticsResponse,
    OverviewMetricsAttributes,
} from '@mailsense/types';
import { logger } from '@utils';
import { AccountRepository } from '../accounts/account.repository.js';
import { AnalyticsRepository } from './analytics.repository.js';
import {
    buildNoAccountsAnalyticsDashboardData,
    calculateDateRange,
    calculatePercentageChange,
    calculateResponseTimeMetrics,
    formatAccountBreakdown,
    formatEmailVolumeTimeSeries,
    formatOverviewMetrics,
    formatTopSenders,
} from './analytics.utils.js';

export class AnalyticsService {
    public async getDashboardAnalytics(userId: string, params: AnalyticsQueryParams): Promise<DashboardAnalyticsResponse> {
        try {
            const targetAccountIds = await this.resolveAccountIds(userId, params.accountId);

            if (targetAccountIds.length === 0) {
                return buildNoAccountsAnalyticsDashboardData(params.timeframe);
            }

            const timeframe = params.timeframe || ANALYTICS_TIMEFRAME.THIRTY_DAYS;
            const dateRange = calculateDateRange(timeframe, params.startDate, params.endDate);

            const [rawOverview, rawPrevOverview, rawVolume, rawSenders, rawResponseTime, rawAccountBreakdown] =
                await Promise.all([
                    AnalyticsRepository.getOverviewCountsRaw(userId, targetAccountIds, dateRange.startDate, dateRange.endDate),
                    dateRange.prevStartDate && dateRange.prevEndDate
                        ? AnalyticsRepository.getOverviewCountsRaw(userId, targetAccountIds, dateRange.prevStartDate, dateRange.prevEndDate)
                        : Promise.resolve(null),
                    AnalyticsRepository.getEmailVolumeTimeSeriesRaw(targetAccountIds, dateRange.startDate, dateRange.endDate),
                    AnalyticsRepository.getTopSendersRaw(targetAccountIds, dateRange.startDate, dateRange.endDate, 5),
                    AnalyticsRepository.getResponseTimeStatsRaw(targetAccountIds, dateRange.startDate, dateRange.endDate),
                    AnalyticsRepository.getAccountBreakdownRaw(targetAccountIds),
                ]);

            const currentOverview = formatOverviewMetrics(rawOverview, targetAccountIds.length);
            const prevOverview = rawPrevOverview ? formatOverviewMetrics(rawPrevOverview, targetAccountIds.length) : null;

            const overview: OverviewMetricsAttributes = {
                ...currentOverview,
                emailsChangePercentage: calculatePercentageChange(currentOverview.totalEmails, prevOverview?.totalEmails),
                unreadChangePercentage: calculatePercentageChange(currentOverview.unreadEmails, prevOverview?.unreadEmails),
                sentChangePercentage: calculatePercentageChange(currentOverview.sentEmails, prevOverview?.sentEmails),
            };

            const volumeTrend = formatEmailVolumeTimeSeries(rawVolume, dateRange.startDate, dateRange.endDate);
            const topSenders = formatTopSenders(rawSenders);
            const responseTime = calculateResponseTimeMetrics(rawResponseTime);
            const accountSummaries = formatAccountBreakdown(rawAccountBreakdown);

            return {
                overview,
                volumeTrend,
                topSenders,
                responseTime,
                accountSummaries,
                timeframe,
                startDate: dateRange.startDate.toISOString(),
                endDate: dateRange.endDate.toISOString(),
            };
        } catch (error) {
            logger.error('Failed to get dashboard analytics in AnalyticsService', { userId, params, error });
            throw error;
        }
    }

    public async refreshAccountMetrics(accountId: string): Promise<void> {
        try {
            const metrics = await AnalyticsRepository.getAccountSyncMetricsRaw(accountId);

            await AnalyticsRepository.upsertDailyAccountMetrics(accountId, {
                totalEmails: metrics.totalEmails,
                totalThreads: metrics.totalThreads,
                unreadCount: metrics.unreadCount,
                sentCount: metrics.sentCount,
                totalLabels: 0,
                totalFolders: 0,
                totalContacts: 0,
            });

            logger.info(`Refreshed account metrics snapshot for account: ${accountId}`);
        } catch (error) {
            logger.error('Failed to refresh account metrics snapshot in AnalyticsService', { accountId, error });
            throw error;
        }
    }

    private async resolveAccountIds(userId: string, requestedAccountId?: string): Promise<string[]> {
        try {
            const userAccounts = await AccountRepository.getAccounts({ userId, active: true });
            const validAccountIds = userAccounts.map((acc) => acc._id.toString());

            if (requestedAccountId) {
                if (!validAccountIds.includes(requestedAccountId)) {
                    throw new Error('Requested account does not belong to the user or is inactive');
                }
                return [requestedAccountId];
            }

            return validAccountIds;
        } catch (error) {
            logger.error('Failed to resolve account IDs in AnalyticsService', { userId, requestedAccountId, error });
            throw error;
        }
    }
}
