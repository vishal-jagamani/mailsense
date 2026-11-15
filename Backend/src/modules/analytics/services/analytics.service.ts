import { LOGGER_MODULE } from '@constants';
import { ForbiddenError } from '@errors';
import { ANALYTICS_TIMEFRAME, AnalyticsQueryParams, DashboardAnalyticsResponse, OverviewMetricsAttributes } from '@mailsense/types';
import { AccountRepository } from '@modules/accounts/database/index.js';
import { createLogger } from '@observability';
import { AnalyticsRepository } from '../database/index.js';
import { DashboardAnalyticsRawDataResponse, DateRangeBoundary, RawOverviewAggregateResult } from '../types/index.js';
import {
    buildNoAccountsAnalyticsDashboardData,
    calculateDateRange,
    calculatePercentageChange,
    calculateResponseTimeMetrics,
    formatAccountBreakdown,
    formatEmailVolumeTimeSeries,
    formatOverviewMetrics,
    formatTopSenders,
} from '../utils/index.js';

const logger = createLogger(LOGGER_MODULE.ANALYTICS_SERVICE);

export class AnalyticsService {
    public async getDashboardAnalytics(userId: string, params: AnalyticsQueryParams): Promise<DashboardAnalyticsResponse> {
        try {
            const targetAccountIds = await this.resolveAccountIds(userId, params.accountId);

            if (targetAccountIds.length === 0) {
                return buildNoAccountsAnalyticsDashboardData(params.timeframe);
            }

            const timeframe = params.timeframe || ANALYTICS_TIMEFRAME.THIRTY_DAYS;
            const dateRange = calculateDateRange(timeframe, params.startDate, params.endDate);

            const rawData = await this.getDashboardAnalyticsRawData(userId, targetAccountIds, timeframe, dateRange);

            const { overview, volumeTrend, topSenders, responseTime, accountSummaries } = this.getOverviewVolumeTrends(
                targetAccountIds,
                rawData,
                dateRange,
            );

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

    private async getDashboardAnalyticsRawData(
        userId: string,
        targetAccountIds: string[],
        timeframe: ANALYTICS_TIMEFRAME,
        dateRange: DateRangeBoundary,
    ): Promise<DashboardAnalyticsRawDataResponse> {
        const [rawOverview, rawPrevOverview, rawVolume, rawSenders, rawResponseTime, rawAccountBreakdown] = await Promise.all([
            AnalyticsRepository.getOverviewCountsRaw(userId, targetAccountIds, dateRange.startDate, dateRange.endDate),
            dateRange.prevStartDate && dateRange.prevEndDate
                ? AnalyticsRepository.getOverviewCountsRaw(userId, targetAccountIds, dateRange.prevStartDate, dateRange.prevEndDate)
                : Promise.resolve(null),
            AnalyticsRepository.getEmailVolumeTimeSeriesRaw(targetAccountIds, dateRange.startDate, dateRange.endDate),
            AnalyticsRepository.getTopSendersRaw(targetAccountIds, dateRange.startDate, dateRange.endDate, 5),
            AnalyticsRepository.getResponseTimeStatsRaw(targetAccountIds, dateRange.startDate, dateRange.endDate),
            AnalyticsRepository.getAccountBreakdownRaw(targetAccountIds),
        ]);

        return { rawOverview, rawPrevOverview, rawVolume, rawSenders, rawResponseTime, rawAccountBreakdown, timeframe };
    }

    private extractPeriodEmailsCount(raw?: RawOverviewAggregateResult | null): number | undefined {
        if (!raw) return undefined;
        return raw.periodEmailsCount ?? raw.facetResult.totalEmails?.[0]?.count ?? 0;
    }

    private buildOverviewMetrics(
        rawOverview: RawOverviewAggregateResult,
        rawPrevOverview: RawOverviewAggregateResult | null,
        accountCount: number,
    ): OverviewMetricsAttributes {
        const currentOverview = formatOverviewMetrics(rawOverview, accountCount);
        const prevOverview = rawPrevOverview ? formatOverviewMetrics(rawPrevOverview, accountCount) : null;

        const currentPeriodEmails = this.extractPeriodEmailsCount(rawOverview) ?? 0;
        const prevPeriodEmails = this.extractPeriodEmailsCount(rawPrevOverview);

        return {
            ...currentOverview,
            emailsChangePercentage: calculatePercentageChange(currentPeriodEmails, prevPeriodEmails),
            unreadChangePercentage: calculatePercentageChange(currentOverview.unreadEmails, prevOverview?.unreadEmails),
            sentChangePercentage: calculatePercentageChange(currentOverview.sentEmails, prevOverview?.sentEmails),
        };
    }

    private getOverviewVolumeTrends(targetAccountIds: string[], rawData: DashboardAnalyticsRawDataResponse, dateRange: DateRangeBoundary) {
        const { rawOverview, rawPrevOverview, rawVolume, rawSenders, rawResponseTime, rawAccountBreakdown } = rawData;
        const overview = this.buildOverviewMetrics(rawOverview, rawPrevOverview, targetAccountIds.length);
        const volumeTrend = formatEmailVolumeTimeSeries(rawVolume, dateRange.startDate, dateRange.endDate);
        const topSenders = formatTopSenders(rawSenders);
        const responseTime = calculateResponseTimeMetrics(rawResponseTime);
        const accountSummaries = formatAccountBreakdown(rawAccountBreakdown);

        return { overview, volumeTrend, topSenders, responseTime, accountSummaries };
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
                    throw new ForbiddenError('Requested account does not belong to the user or is inactive');
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
