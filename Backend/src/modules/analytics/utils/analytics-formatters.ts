import { LOGGER_MODULE } from '@constants';
import {
    AccountActivitySummaryAttributes,
    ANALYTICS_TIMEFRAME,
    DashboardAnalyticsResponse,
    EmailVolumeDataPointAttributes,
    OverviewMetricsAttributes,
    TopSenderDataAttributes,
} from '@mailsense/types';
import { createLogger } from '@observability';
import { RawAccountBreakdownResult, RawOverviewAggregateResult, RawTopSendersResult, RawVolumeDataPoint } from '../analytics.types.js';

const logger = createLogger(LOGGER_MODULE.ANALYTICS_UTILS);

export const buildNoAccountsAnalyticsDashboardData = (timeframe?: ANALYTICS_TIMEFRAME): DashboardAnalyticsResponse => {
    try {
        const emptyDate = new Date().toISOString();
        return {
            overview: {
                totalEmails: 0,
                unreadEmails: 0,
                sentEmails: 0,
                starredEmails: 0,
                draftsCount: 0,
                activeAccountsCount: 0,
                totalThreadsCount: 0,
                emailsChangePercentage: 0,
                unreadChangePercentage: 0,
                sentChangePercentage: 0,
            },
            volumeTrend: [],
            topSenders: [],
            responseTime: {
                averageResponseMinutes: 0,
                medianResponseMinutes: 0,
                totalRepliesAnalyzed: 0,
                responseRatePercentage: 0,
                distribution: {
                    under1Hour: 0,
                    between1And4Hours: 0,
                    between4And24Hours: 0,
                    over24Hours: 0,
                },
            },
            accountSummaries: [],
            timeframe: timeframe || ANALYTICS_TIMEFRAME.THIRTY_DAYS,
            startDate: emptyDate,
            endDate: emptyDate,
        };
    } catch (error) {
        logger.error('Failed to build no accounts analytics dashboard data in AnalyticsUtils', { timeframe, error });
        throw error;
    }
};

export const formatOverviewMetrics = (raw: RawOverviewAggregateResult, activeAccountsCount: number): OverviewMetricsAttributes => {
    try {
        const facet = raw.facetResult || {};
        const totalEmails = raw.allTimeTotalEmails ?? facet.totalEmails?.[0]?.count ?? 0;
        const unreadEmails = facet.unreadEmails?.[0]?.count ?? 0;
        const sentEmails = facet.sentEmails?.[0]?.count ?? 0;
        const starredEmails = facet.starredEmails?.[0]?.count ?? 0;
        const totalThreadsCount = facet.threads?.[0]?.count ?? 0;

        return {
            totalEmails,
            unreadEmails,
            sentEmails,
            starredEmails,
            draftsCount: raw.draftsCount,
            activeAccountsCount,
            totalThreadsCount,
        };
    } catch (err) {
        logger.error('Failed to format overview metrics in AnalyticsUtils', { err });
        throw err;
    }
};

export const formatEmailVolumeTimeSeries = (
    rawVolumePoints: RawVolumeDataPoint[],
    startDate: Date,
    endDate: Date,
): EmailVolumeDataPointAttributes[] => {
    try {
        const resultMap = new Map<string, { receivedCount: number; sentCount: number }>();
        for (const item of rawVolumePoints) {
            resultMap.set(item._id, {
                receivedCount: item.receivedCount,
                sentCount: item.sentCount,
            });
        }

        const timeSeries: EmailVolumeDataPointAttributes[] = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dateKey = currentDate.toISOString().split('T')[0];
            const stats = resultMap.get(dateKey) || { receivedCount: 0, sentCount: 0 };

            timeSeries.push({
                date: dateKey,
                receivedCount: stats.receivedCount,
                sentCount: stats.sentCount,
                totalCount: stats.receivedCount + stats.sentCount,
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return timeSeries;
    } catch (err) {
        logger.error('Failed to format email volume time series in AnalyticsUtils', { startDate, endDate, err });
        throw err;
    }
};

export const formatTopSenders = (raw: RawTopSendersResult): TopSenderDataAttributes[] => {
    try {
        return raw.senders.map((sender) => {
            const rawFrom = sender._id || 'Unknown';
            let name = rawFrom;
            let email = rawFrom;

            const match = /^(.*?)\s*<(.+?)>$/.exec(rawFrom);
            if (match) {
                name = match[1].replace(/["']/g, '').trim() || match[2];
                email = match[2].trim();
            }

            const percentage = raw.totalIncoming > 0 ? Math.round((sender.count / raw.totalIncoming) * 1000) / 10 : 0;

            return {
                name,
                email,
                count: sender.count,
                percentage,
                lastReceivedAt: sender.lastReceivedAt ? sender.lastReceivedAt.toISOString() : new Date().toISOString(),
            };
        });
    } catch (err) {
        logger.error('Failed to format top senders in AnalyticsUtils', { err });
        throw err;
    }
};

export const formatAccountBreakdown = (raw: RawAccountBreakdownResult): AccountActivitySummaryAttributes[] => {
    try {
        const statsMap = new Map<string, { totalEmails: number; unreadEmails: number; sentEmails: number }>();
        for (const item of raw.emailStats) {
            statsMap.set(item._id.toString(), item);
        }

        return raw.accounts.map((acc) => {
            const accIdStr = acc._id.toString();
            const stats = statsMap.get(accIdStr) || { totalEmails: 0, unreadEmails: 0, sentEmails: 0 };

            return {
                accountId: accIdStr,
                emailAddress: acc.emailAddress,
                provider: acc.provider,
                totalEmails: stats.totalEmails,
                unreadEmails: stats.unreadEmails,
                sentEmails: stats.sentEmails,
                lastSyncedAt: acc.lastSyncedAt,
            };
        });
    } catch (err) {
        logger.error('Failed to format account breakdown in AnalyticsUtils', { err });
        throw err;
    }
};
