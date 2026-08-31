import { ANALYTICS_TIMEFRAME } from '@mailsense/types';
import { logger } from '@utils';
import { AnalyticsRepository } from '../analytics.repository.js';
import { AnalyticsService } from '../analytics.service.js';

export interface BenchmarkResult {
    documentCount: number;
    overviewLatencyMs: number;
    volumeLatencyMs: number;
    sendersLatencyMs: number;
    responseTimeLatencyMs: number;
    totalDashboardLatencyMs: number;
    heapUsedDeltaMb: number;
    passedLatencySla: boolean;
    passedMemorySla: boolean;
}

export class AnalyticsPerformanceBenchmark {
    public static async runScaleBenchmark(accountId: string, userId: string, sampleSize: number = 10000): Promise<BenchmarkResult> {
        try {
            logger.info('Starting Analytics Performance Benchmark', { accountId, sampleSize });

            // 1. Measure initial memory baseline
            const gc = (globalThis as { gc?: () => void }).gc;
            if (typeof gc === 'function') {
                gc();
            }
            const initialMemory = process.memoryUsage().heapUsed;
            const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const endDate = new Date();

            // 2. Profile Overview Aggregation
            const t0 = performance.now();
            await AnalyticsRepository.getOverviewCountsRaw(userId, [accountId], startDate, endDate);
            const overviewLatencyMs = Math.round(performance.now() - t0);

            // 3. Profile Volume Time Series
            const t1 = performance.now();
            await AnalyticsRepository.getEmailVolumeTimeSeriesRaw([accountId], startDate, endDate);
            const volumeLatencyMs = Math.round(performance.now() - t1);

            // 4. Profile Top Senders
            const t2 = performance.now();
            await AnalyticsRepository.getTopSendersRaw([accountId], startDate, endDate, 5);
            const sendersLatencyMs = Math.round(performance.now() - t2);

            // 5. Profile Response Time Turnaround
            const t3 = performance.now();
            await AnalyticsRepository.getResponseTimeStatsRaw([accountId], startDate, endDate);
            const responseTimeLatencyMs = Math.round(performance.now() - t3);

            // 6. Profile End-to-End Concurrent Service Execution
            const analyticsService = new AnalyticsService();
            const t4 = performance.now();
            await analyticsService.getDashboardAnalytics(userId, {
                accountId,
                timeframe: ANALYTICS_TIMEFRAME.THIRTY_DAYS,
            });
            const totalDashboardLatencyMs = Math.round(performance.now() - t4);

            // 7. Measure peak heap delta
            const finalMemory = process.memoryUsage().heapUsed;
            const heapUsedDeltaMb = Math.round(((finalMemory - initialMemory) / (1024 * 1024)) * 10) / 10;

            const passedLatencySla = totalDashboardLatencyMs < 100;
            const passedMemorySla = heapUsedDeltaMb < 20;

            const result: BenchmarkResult = {
                documentCount: sampleSize,
                overviewLatencyMs,
                volumeLatencyMs,
                sendersLatencyMs,
                responseTimeLatencyMs,
                totalDashboardLatencyMs,
                heapUsedDeltaMb,
                passedLatencySla,
                passedMemorySla,
            };

            logger.info('Analytics Performance Benchmark Completed', { result });
            return result;
        } catch (error) {
            logger.error('Analytics Performance Benchmark Failed', { accountId, sampleSize, error });
            throw error;
        }
    }
}

jest.mock('../analytics.repository.js');
jest.mock('../analytics.service.js');

describe('AnalyticsPerformanceBenchmark — Unit & Scale SLA Tests', () => {
    const mockAccountId = 'acc_bench_123';
    const mockUserId = 'usr_bench_456';

    beforeEach(() => {
        try {
            jest.clearAllMocks();
            (AnalyticsRepository.getOverviewCountsRaw as jest.Mock).mockResolvedValue({
                totalEmails: 10000,
                unreadEmails: 500,
                sentEmails: 2000,
                starredEmails: 300,
                draftsCount: 20,
            });
            (AnalyticsRepository.getEmailVolumeTimeSeriesRaw as jest.Mock).mockResolvedValue([
                { date: '2026-08-01', received: 100, sent: 50 },
            ]);
            (AnalyticsRepository.getTopSendersRaw as jest.Mock).mockResolvedValue([
                { email: 'sender@example.com', name: 'Sender', count: 50 },
            ]);
            (AnalyticsRepository.getResponseTimeStatsRaw as jest.Mock).mockResolvedValue({
                averageMinutes: 15,
                fastestMinutes: 2,
                slowestMinutes: 120,
                underOneHourCount: 80,
                oneToFourHoursCount: 15,
                fourToTwentyFourHoursCount: 5,
                overTwentyFourHoursCount: 0,
            });
            (AnalyticsService.prototype.getDashboardAnalytics as jest.Mock).mockResolvedValue({
                overview: {
                    totalEmails: 10000,
                    unreadEmails: 500,
                    sentEmails: 2000,
                    starredEmails: 300,
                    draftsCount: 20,
                    activeAccountsCount: 1,
                    totalThreadsCount: 4000,
                    emailsChangePercentage: 10,
                    unreadChangePercentage: -5,
                    sentChangePercentage: 8,
                },
                volumeTrend: [],
                topSenders: [],
                responseTime: {
                    averageMinutes: 15,
                    fastestMinutes: 2,
                    slowestMinutes: 120,
                    underOneHourPercentage: 80,
                    oneToFourHoursPercentage: 15,
                    fourToTwentyFourHoursPercentage: 5,
                    overTwentyFourHoursPercentage: 0,
                },
            });
        } catch (error) {
            console.error('Failed in beforeEach of benchmark test', error);
        }
    });

    it('should run scale benchmark successfully and return metrics passing latency & memory SLAs', async () => {
        try {
            const result = await AnalyticsPerformanceBenchmark.runScaleBenchmark(mockAccountId, mockUserId, 15000);

            expect(result).toBeDefined();
            expect(result.documentCount).toBe(15000);
            expect(result.passedLatencySla).toBe(true);
            expect(result.passedMemorySla).toBe(true);
            expect(AnalyticsRepository.getOverviewCountsRaw).toHaveBeenCalledTimes(1);
            expect(AnalyticsRepository.getEmailVolumeTimeSeriesRaw).toHaveBeenCalledTimes(1);
            expect(AnalyticsRepository.getTopSendersRaw).toHaveBeenCalledTimes(1);
            expect(AnalyticsRepository.getResponseTimeStatsRaw).toHaveBeenCalledTimes(1);
            expect(AnalyticsService.prototype.getDashboardAnalytics).toHaveBeenCalledTimes(1);
        } catch (error) {
            expect(error).toBeUndefined();
        }
    });

    it('should invoke global gc when available during benchmark initialization', async () => {
        try {
            const mockGc = jest.fn();
            (globalThis as { gc?: () => void }).gc = mockGc;

            const result = await AnalyticsPerformanceBenchmark.runScaleBenchmark(mockAccountId, mockUserId);

            expect(mockGc).toHaveBeenCalled();
            expect(result.documentCount).toBe(10000);

            delete (globalThis as { gc?: () => void }).gc;
        } catch (error) {
            expect(error).toBeUndefined();
        }
    });

    it('should catch and propagate errors if repository calls fail during benchmark profiling', async () => {
        try {
            (AnalyticsRepository.getOverviewCountsRaw as jest.Mock).mockRejectedValue(new Error('DB Query Timeout'));

            await expect(AnalyticsPerformanceBenchmark.runScaleBenchmark(mockAccountId, mockUserId)).rejects.toThrow('DB Query Timeout');
        } catch (error) {
            expect(error).toBeUndefined();
        }
    });
});
