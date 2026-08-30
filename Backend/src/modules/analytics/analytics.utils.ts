import {
    AccountActivitySummaryAttributes,
    ANALYTICS_TIMEFRAME,
    DashboardAnalyticsResponse,
    EmailVolumeDataPointAttributes,
    OverviewMetricsAttributes,
    ResponseTimeDistributionAttributes,
    ResponseTimeMetricsAttributes,
    TopSenderDataAttributes,
} from '@mailsense/types';
import { logger } from '@utils';
import {
    DateRangeBoundary,
    RawAccountBreakdownResult,
    RawOverviewAggregateResult,
    RawThreadResponseTimeSummary,
    RawTopSendersResult,
    RawVolumeDataPoint,
} from './analytics.types.js';

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

export const calculatePercentageChange = (current: number, previous?: number): number | undefined => {
    try {
        if (previous === undefined || previous === null || previous === 0) {
            return current > 0 ? 100 : 0;
        }
        return Math.round(((current - previous) / previous) * 1000) / 10;
    } catch (err) {
        logger.error('Failed to calculate percentage change in AnalyticsUtils', { current, previous, error: err });
        throw err;
    }
};

export const calculateDateRange = (timeframe: ANALYTICS_TIMEFRAME, customStartDateStr?: string, customEndDateStr?: string): DateRangeBoundary => {
    try {
        const now = new Date();
        const endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);

        let startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);

        let prevStartDate: Date | undefined;
        let prevEndDate: Date | undefined;

        switch (timeframe) {
            case ANALYTICS_TIMEFRAME.TODAY: {
                startDate = new Date(now);
                startDate.setHours(0, 0, 0, 0);

                prevStartDate = new Date(startDate);
                prevStartDate.setDate(prevStartDate.getDate() - 1);
                prevEndDate = new Date(endDate);
                prevEndDate.setDate(prevEndDate.getDate() - 1);
                break;
            }
            case ANALYTICS_TIMEFRAME.SEVEN_DAYS: {
                startDate.setDate(now.getDate() - 6);

                prevStartDate = new Date(startDate);
                prevStartDate.setDate(prevStartDate.getDate() - 7);
                prevEndDate = new Date(startDate);
                prevEndDate.setMilliseconds(prevEndDate.getMilliseconds() - 1);
                break;
            }
            case ANALYTICS_TIMEFRAME.THIRTY_DAYS: {
                startDate.setDate(now.getDate() - 29);

                prevStartDate = new Date(startDate);
                prevStartDate.setDate(prevStartDate.getDate() - 30);
                prevEndDate = new Date(startDate);
                prevEndDate.setMilliseconds(prevEndDate.getMilliseconds() - 1);
                break;
            }
            case ANALYTICS_TIMEFRAME.NINETY_DAYS: {
                startDate.setDate(now.getDate() - 89);

                prevStartDate = new Date(startDate);
                prevStartDate.setDate(prevStartDate.getDate() - 90);
                prevEndDate = new Date(startDate);
                prevEndDate.setMilliseconds(prevEndDate.getMilliseconds() - 1);
                break;
            }
            case ANALYTICS_TIMEFRAME.THIS_MONTH: {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

                prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
                prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
                break;
            }
            case ANALYTICS_TIMEFRAME.ONE_YEAR: {
                startDate.setFullYear(now.getFullYear() - 1);

                prevStartDate = new Date(startDate);
                prevStartDate.setFullYear(prevStartDate.getFullYear() - 1);
                prevEndDate = new Date(startDate);
                prevEndDate.setMilliseconds(prevEndDate.getMilliseconds() - 1);
                break;
            }
            case ANALYTICS_TIMEFRAME.ALL_TIME: {
                startDate = new Date(2020, 0, 1, 0, 0, 0, 0);
                break;
            }
            case ANALYTICS_TIMEFRAME.CUSTOM: {
                if (customStartDateStr) {
                    startDate = new Date(customStartDateStr);
                }
                if (customEndDateStr) {
                    endDate.setTime(new Date(customEndDateStr).getTime());
                }
                break;
            }
            default: {
                startDate.setDate(now.getDate() - 29);
            }
        }

        return { startDate, endDate, prevStartDate, prevEndDate };
    } catch (err) {
        logger.error('Failed to calculate date range in AnalyticsUtils', { timeframe, customStartDateStr, customEndDateStr, err });
        throw err;
    }
};

export const formatOverviewMetrics = (raw: RawOverviewAggregateResult, activeAccountsCount: number): OverviewMetricsAttributes => {
    try {
        const facet = raw.facetResult || {};
        const totalEmails = facet.totalEmails?.[0]?.count ?? 0;
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

export const calculateResponseTimeMetrics = (threadSummaries: RawThreadResponseTimeSummary[]): ResponseTimeMetricsAttributes => {
    try {
        let totalIncomingThreads = 0;
        let repliedThreadsCount = 0;
        const deltasInMinutes: number[] = [];

        const distribution: ResponseTimeDistributionAttributes = {
            under1Hour: 0,
            between1And4Hours: 0,
            between4And24Hours: 0,
            over24Hours: 0,
        };

        for (const item of threadSummaries) {
            totalIncomingThreads++;
            if (item.firstReceivedAt && item.firstSentAt) {
                const receivedTime = new Date(item.firstReceivedAt).getTime();
                const sentTime = new Date(item.firstSentAt).getTime();

                if (sentTime > receivedTime) {
                    const deltaMinutes = Math.round((sentTime - receivedTime) / (1000 * 60));
                    // Discard unrealistic deltas > 30 days (43200 minutes)
                    if (deltaMinutes <= 43200) {
                        repliedThreadsCount++;
                        deltasInMinutes.push(deltaMinutes);

                        if (deltaMinutes < 60) {
                            distribution.under1Hour++;
                        } else if (deltaMinutes <= 240) {
                            distribution.between1And4Hours++;
                        } else if (deltaMinutes <= 1440) {
                            distribution.between4And24Hours++;
                        } else {
                            distribution.over24Hours++;
                        }
                    }
                }
            }
        }

        let averageResponseMinutes = 0;
        let medianResponseMinutes = 0;

        if (deltasInMinutes.length > 0) {
            const totalMinutes = deltasInMinutes.reduce((sum, val) => sum + val, 0);
            averageResponseMinutes = Math.round(totalMinutes / deltasInMinutes.length);

            deltasInMinutes.sort((a, b) => a - b);
            const midIndex = Math.floor(deltasInMinutes.length / 2);
            medianResponseMinutes =
                deltasInMinutes.length % 2 !== 0
                    ? deltasInMinutes[midIndex]
                    : Math.round((deltasInMinutes[midIndex - 1] + deltasInMinutes[midIndex]) / 2);
        }

        const responseRatePercentage = totalIncomingThreads > 0 ? Math.round((repliedThreadsCount / totalIncomingThreads) * 1000) / 10 : 0;

        return {
            averageResponseMinutes,
            medianResponseMinutes,
            totalRepliesAnalyzed: repliedThreadsCount,
            responseRatePercentage,
            distribution,
        };
    } catch (err) {
        logger.error('Failed to calculate response time metrics in AnalyticsUtils', { err });
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
