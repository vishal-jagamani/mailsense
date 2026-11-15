import { LOGGER_MODULE } from '@constants';
import { ANALYTICS_TIMEFRAME, ResponseTimeDistributionAttributes, ResponseTimeMetricsAttributes } from '@mailsense/types';
import { createLogger } from '@observability';
import { computeMedian, recordDistributionBucket } from './analytics-common.utils.js';
import { DateRangeBoundary, RawThreadResponseTimeSummary } from '../types/index.js';

const logger = createLogger(LOGGER_MODULE.ANALYTICS_UTILS);

const ROLLING_DAYS: Record<string, number> = {
    [ANALYTICS_TIMEFRAME.SEVEN_DAYS]: 7,
    [ANALYTICS_TIMEFRAME.THIRTY_DAYS]: 30,
    [ANALYTICS_TIMEFRAME.NINETY_DAYS]: 90,
};

function getRollingDaysRange(now: Date, endDate: Date, days: number): DateRangeBoundary {
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(now.getDate() - (days - 1));

    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);

    const prevEndDate = new Date(startDate.getTime() - 1);

    return { startDate, endDate, prevStartDate, prevEndDate };
}

function getTodayDateRange(now: Date, endDate: Date): DateRangeBoundary {
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - 1);
    const prevEndDate = new Date(endDate);
    prevEndDate.setDate(prevEndDate.getDate() - 1);
    return { startDate, endDate, prevStartDate, prevEndDate };
}

function getThisMonthDateRange(now: Date, endDate: Date): DateRangeBoundary {
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { startDate, endDate, prevStartDate, prevEndDate };
}

function getOneYearDateRange(now: Date, endDate: Date): DateRangeBoundary {
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    startDate.setFullYear(now.getFullYear() - 1);
    const prevStartDate = new Date(startDate);
    prevStartDate.setFullYear(prevStartDate.getFullYear() - 1);
    return { startDate, endDate, prevStartDate, prevEndDate: new Date(startDate.getTime() - 1) };
}

function getCustomDateRange(now: Date, endDate: Date, customStartDateStr?: string, customEndDateStr?: string): DateRangeBoundary {
    let startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    if (customStartDateStr) startDate = new Date(customStartDateStr);
    const resolvedEndDate = new Date(endDate);
    if (customEndDateStr) resolvedEndDate.setTime(new Date(customEndDateStr).getTime());
    return { startDate, endDate: resolvedEndDate };
}

export const calculateDateRange = (timeframe: ANALYTICS_TIMEFRAME, customStartDateStr?: string, customEndDateStr?: string): DateRangeBoundary => {
    try {
        const now = new Date();
        const endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);

        const rollingDays = ROLLING_DAYS[timeframe];
        if (rollingDays) {
            return getRollingDaysRange(now, endDate, rollingDays);
        }

        switch (timeframe) {
            case ANALYTICS_TIMEFRAME.TODAY:
                return getTodayDateRange(now, endDate);
            case ANALYTICS_TIMEFRAME.THIS_MONTH:
                return getThisMonthDateRange(now, endDate);
            case ANALYTICS_TIMEFRAME.ONE_YEAR:
                return getOneYearDateRange(now, endDate);
            case ANALYTICS_TIMEFRAME.ALL_TIME:
                return { startDate: new Date(2020, 0, 1, 0, 0, 0, 0), endDate };
            case ANALYTICS_TIMEFRAME.CUSTOM:
                return getCustomDateRange(now, endDate, customStartDateStr, customEndDateStr);
            default:
                return getRollingDaysRange(now, endDate, 30);
        }
    } catch (err) {
        logger.error('Failed to calculate date range in AnalyticsUtils', { timeframe, customStartDateStr, customEndDateStr, err });
        throw err;
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
            if (!item.firstReceivedAt || !item.firstSentAt) continue;

            const receivedTime = new Date(item.firstReceivedAt).getTime();
            const sentTime = new Date(item.firstSentAt).getTime();
            if (sentTime <= receivedTime) continue;

            const deltaMinutes = Math.round((sentTime - receivedTime) / (1000 * 60));
            if (deltaMinutes > 43200) continue;

            repliedThreadsCount++;
            deltasInMinutes.push(deltaMinutes);
            recordDistributionBucket(distribution, deltaMinutes);
        }

        let averageResponseMinutes = 0;
        let medianResponseMinutes = 0;

        if (deltasInMinutes.length > 0) {
            const totalMinutes = deltasInMinutes.reduce((sum, val) => sum + val, 0);
            averageResponseMinutes = Math.round(totalMinutes / deltasInMinutes.length);

            deltasInMinutes.sort((a, b) => a - b);
            medianResponseMinutes = computeMedian(deltasInMinutes);
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
