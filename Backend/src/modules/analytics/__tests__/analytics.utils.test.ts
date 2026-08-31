import {
    ANALYTICS_TIMEFRAME,
    EmailVolumeDataPointAttributes,
    ResponseTimeMetricsAttributes,
    TopSenderDataAttributes
} from '@mailsense/types';
import {
    RawThreadResponseTimeSummary,
    RawTopSendersResult,
    RawVolumeDataPoint
} from '../analytics.types.js';
import {
    buildNoAccountsAnalyticsDashboardData,
    calculateDateRange,
    calculatePercentageChange,
    calculateResponseTimeMetrics,
    formatEmailVolumeTimeSeries,
    formatTopSenders
} from '../analytics.utils.js';

describe('Analytics Utilities — Unit Test Suite', () => {
    describe('calculateDateRange', () => {
        it('should compute exact 7-day boundaries with previous comparison period', () => {
            try {
                const result = calculateDateRange(ANALYTICS_TIMEFRAME.SEVEN_DAYS);
                expect(result.startDate).toBeInstanceOf(Date);
                expect(result.endDate).toBeInstanceOf(Date);
                expect(result.prevStartDate).toBeInstanceOf(Date);
                expect(result.prevEndDate).toBeInstanceOf(Date);

                if (result.prevStartDate && result.prevEndDate) {
                    const currentDiff = Math.round((result.endDate.getTime() - result.startDate.getTime()) / (1000 * 60 * 60 * 24));
                    const prevDiff = Math.round((result.prevEndDate.getTime() - result.prevStartDate.getTime()) / (1000 * 60 * 60 * 24));
                    expect(currentDiff).toBe(7);
                    expect(prevDiff).toBe(7);
                }
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should compute TODAY boundaries starting at 00:00:00 and ending at 23:59:59', () => {
            try {
                const result = calculateDateRange(ANALYTICS_TIMEFRAME.TODAY);
                expect(result.startDate.getHours()).toBe(0);
                expect(result.startDate.getMinutes()).toBe(0);
                expect(result.endDate.getHours()).toBe(23);
                expect(result.endDate.getMinutes()).toBe(59);
                expect(result.prevStartDate?.getDate()).toBe(result.startDate.getDate() - 1);
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should compute THIS_MONTH boundaries starting at the 1st of current month', () => {
            try {
                const now = new Date();
                const result = calculateDateRange(ANALYTICS_TIMEFRAME.THIS_MONTH);
                expect(result.startDate.getDate()).toBe(1);
                expect(result.startDate.getMonth()).toBe(now.getMonth());
                expect(result.prevStartDate?.getDate()).toBe(1);
                expect(result.prevStartDate?.getMonth()).toBe((now.getMonth() + 11) % 12);
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should handle custom date boundaries and parse strings cleanly', () => {
            try {
                const customStart = '2026-05-01T00:00:00.000Z';
                const customEnd = '2026-05-15T23:59:59.999Z';
                const result = calculateDateRange(ANALYTICS_TIMEFRAME.CUSTOM, customStart, customEnd);

                expect(result.startDate.toISOString()).toBe(customStart);
                expect(result.endDate.getTime()).toBe(new Date(customEnd).getTime());
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });
    });

    describe('calculatePercentageChange', () => {
        it('should compute positive percentage changes accurately', () => {
            try {
                const change = calculatePercentageChange(150, 100);
                expect(change).toBe(50);
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should compute negative percentage changes accurately', () => {
            try {
                const change = calculatePercentageChange(75, 100);
                expect(change).toBe(-25);
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should handle zero previous count by returning 100% when current > 0', () => {
            try {
                const change = calculatePercentageChange(25, 0);
                expect(change).toBe(100);
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should return 0 when both current and previous counts are 0', () => {
            try {
                const change = calculatePercentageChange(0, 0);
                expect(change).toBe(0);
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });
    });

    describe('formatEmailVolumeTimeSeries', () => {
        it('should seamlessly backfill missing dates with zero counts for contiguous charting', () => {
            try {
                const startDate = new Date('2026-08-01T00:00:00.000Z');
                const endDate = new Date('2026-08-05T00:00:00.000Z');

                const rawData: RawVolumeDataPoint[] = [
                    { _id: '2026-08-01', receivedCount: 12, sentCount: 4 },
                    { _id: '2026-08-04', receivedCount: 8, sentCount: 2 },
                ];

                const timeSeries: EmailVolumeDataPointAttributes[] = formatEmailVolumeTimeSeries(rawData, startDate, endDate);

                expect(timeSeries.length).toBe(5);
                expect(timeSeries[0]).toEqual({ date: '2026-08-01', receivedCount: 12, sentCount: 4, totalCount: 16 });
                expect(timeSeries[1]).toEqual({ date: '2026-08-02', receivedCount: 0, sentCount: 0, totalCount: 0 });
                expect(timeSeries[2]).toEqual({ date: '2026-08-03', receivedCount: 0, sentCount: 0, totalCount: 0 });
                expect(timeSeries[3]).toEqual({ date: '2026-08-04', receivedCount: 8, sentCount: 2, totalCount: 10 });
                expect(timeSeries[4]).toEqual({ date: '2026-08-05', receivedCount: 0, sentCount: 0, totalCount: 0 });
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });
    });

    describe('formatTopSenders', () => {
        it('should extract RFC 2822 display names and email addresses correctly', () => {
            try {
                const rawSenders: RawTopSendersResult = {
                    senders: [
                        {
                            _id: 'Sarah Connor <sarah@cyberdyne.com>',
                            count: 45,
                            lastReceivedAt: new Date('2026-08-25T10:00:00Z'),
                        },
                        {
                            _id: 'john.doe@example.com',
                            count: 15,
                            lastReceivedAt: new Date('2026-08-24T12:00:00Z'),
                        },
                    ],
                    totalIncoming: 60,
                };

                const formatted: TopSenderDataAttributes[] = formatTopSenders(rawSenders);

                expect(formatted.length).toBe(2);
                expect(formatted[0].name).toBe('Sarah Connor');
                expect(formatted[0].email).toBe('sarah@cyberdyne.com');
                expect(formatted[0].count).toBe(45);
                expect(formatted[0].percentage).toBe(75);

                expect(formatted[1].name).toBe('john.doe@example.com');
                expect(formatted[1].email).toBe('john.doe@example.com');
                expect(formatted[1].count).toBe(15);
                expect(formatted[1].percentage).toBe(25);
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });
    });

    describe('calculateResponseTimeMetrics', () => {
        it('should accurately compute turnaround distribution, average, and median response minutes', () => {
            try {
                const rawSummaries: RawThreadResponseTimeSummary[] = [
                    {
                        _id: 'thread_1',
                        firstReceivedAt: new Date('2026-08-20T10:00:00Z'),
                        firstSentAt: new Date('2026-08-20T10:30:00Z'), // 30 mins (< 1h)
                        hasReceived: true,
                        hasSent: true,
                    },
                    {
                        _id: 'thread_2',
                        firstReceivedAt: new Date('2026-08-20T10:00:00Z'),
                        firstSentAt: new Date('2026-08-20T12:00:00Z'), // 120 mins (1-4h)
                        hasReceived: true,
                        hasSent: true,
                    },
                    {
                        _id: 'thread_3',
                        firstReceivedAt: new Date('2026-08-20T10:00:00Z'),
                        firstSentAt: new Date('2026-08-20T18:00:00Z'), // 480 mins (4-24h)
                        hasReceived: true,
                        hasSent: true,
                    },
                    {
                        _id: 'thread_4',
                        firstReceivedAt: new Date('2026-08-20T10:00:00Z'),
                        firstSentAt: new Date('2026-08-22T10:00:00Z'), // 2880 mins (> 24h)
                        hasReceived: true,
                        hasSent: true,
                    },
                    {
                        _id: 'thread_5_unreplied',
                        firstReceivedAt: new Date('2026-08-20T10:00:00Z'),
                        firstSentAt: null,
                        hasReceived: true,
                        hasSent: false,
                    },
                ];

                const metrics: ResponseTimeMetricsAttributes = calculateResponseTimeMetrics(rawSummaries);

                expect(metrics.totalRepliesAnalyzed).toBe(4);
                expect(metrics.responseRatePercentage).toBe(80); // 4 out of 5
                expect(metrics.distribution.under1Hour).toBe(1);
                expect(metrics.distribution.between1And4Hours).toBe(1);
                expect(metrics.distribution.between4And24Hours).toBe(1);
                expect(metrics.distribution.over24Hours).toBe(1);
                expect(metrics.averageResponseMinutes).toBe(878); // (30 + 120 + 480 + 2880) / 4 = 877.5 -> 878
                expect(metrics.medianResponseMinutes).toBe(300); // (120 + 480) / 2 = 300
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should ignore turnaround deltas exceeding 30 days (43,200 minutes) as outliers', () => {
            try {
                const rawSummaries: RawThreadResponseTimeSummary[] = [
                    {
                        _id: 'thread_valid',
                        firstReceivedAt: new Date('2026-08-01T10:00:00Z'),
                        firstSentAt: new Date('2026-08-01T11:00:00Z'), // 60 mins
                        hasReceived: true,
                        hasSent: true,
                    },
                    {
                        _id: 'thread_outlier',
                        firstReceivedAt: new Date('2026-01-01T10:00:00Z'),
                        firstSentAt: new Date('2026-08-01T10:00:00Z'), // ~212 days
                        hasReceived: true,
                        hasSent: true,
                    },
                ];

                const metrics: ResponseTimeMetricsAttributes = calculateResponseTimeMetrics(rawSummaries);

                expect(metrics.totalRepliesAnalyzed).toBe(1);
                expect(metrics.averageResponseMinutes).toBe(60);
                expect(metrics.medianResponseMinutes).toBe(60);
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });
    });

    describe('buildNoAccountsAnalyticsDashboardData', () => {
        it('should return a complete zero-state dashboard response without throwing errors', () => {
            try {
                const fallback = buildNoAccountsAnalyticsDashboardData(ANALYTICS_TIMEFRAME.THIRTY_DAYS);

                expect(fallback.overview.totalEmails).toBe(0);
                expect(fallback.overview.activeAccountsCount).toBe(0);
                expect(fallback.volumeTrend).toEqual([]);
                expect(fallback.topSenders).toEqual([]);
                expect(fallback.responseTime.averageResponseMinutes).toBe(0);
                expect(fallback.accountSummaries).toEqual([]);
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });
    });
});
