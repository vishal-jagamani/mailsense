import express, { Express, NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { ANALYTICS_TIMEFRAME, DashboardAnalyticsResponse } from '@mailsense/types';

// Mock auth middleware before importing routes
jest.mock('@middlewares', () => {
    const actual = jest.requireActual('@middlewares') as object;
    return {
        ...actual,
        authMiddleware: (req: Request, _res: Response, next: NextFunction) => {
            try {
                req.user = { id: 'usr_verified_123' };
                next();
            } catch (err) {
                next(err);
            }
        },
    };
});

import analyticsRoutes from '../analytics.routes.js';
import { AnalyticsService } from '../analytics.service.js';

describe('Analytics API — REST Integration Tests', () => {
    let app: Express;

    beforeAll(() => {
        try {
            app = express();
            app.use(express.json());
            app.use('/api/analytics', analyticsRoutes);
        } catch (error) {
            console.error('Failed to initialize Express app for analytics integration test', error);
        }
    });

    afterEach(() => {
        try {
            jest.clearAllMocks();
        } catch (error) {
            console.error('Failed to clear mocks after test', error);
        }
    });

    it('GET /api/analytics/dashboard should return 200 OK with full analytics payload', async () => {
        try {
            const mockResponse: DashboardAnalyticsResponse = {
                overview: {
                    totalEmails: 350,
                    unreadEmails: 24,
                    sentEmails: 80,
                    starredEmails: 12,
                    draftsCount: 2,
                    activeAccountsCount: 1,
                    totalThreadsCount: 140,
                    emailsChangePercentage: 15.5,
                    unreadChangePercentage: -5.2,
                    sentChangePercentage: 10.0,
                },
                volumeTrend: [
                    { date: '2026-08-25', receivedCount: 10, sentCount: 3, totalCount: 13 },
                    { date: '2026-08-26', receivedCount: 15, sentCount: 5, totalCount: 20 },
                ],
                topSenders: [
                    {
                        name: 'Tech Support',
                        email: 'support@tech.com',
                        count: 18,
                        percentage: 28.5,
                        lastReceivedAt: new Date().toISOString(),
                    },
                ],
                responseTime: {
                    averageResponseMinutes: 45,
                    medianResponseMinutes: 30,
                    totalRepliesAnalyzed: 25,
                    responseRatePercentage: 88.5,
                    distribution: {
                        under1Hour: 15,
                        between1And4Hours: 7,
                        between4And24Hours: 2,
                        over24Hours: 1,
                    },
                },
                accountSummaries: [],
                timeframe: ANALYTICS_TIMEFRAME.THIRTY_DAYS,
                startDate: new Date().toISOString(),
                endDate: new Date().toISOString(),
            };

            jest.spyOn(AnalyticsService.prototype, 'getDashboardAnalytics').mockResolvedValue(mockResponse);

            const res = await request(app)
                .get('/api/analytics/dashboard')
                .query({ timeframe: ANALYTICS_TIMEFRAME.THIRTY_DAYS });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.overview.totalEmails).toBe(350);
            expect(res.body.data.volumeTrend.length).toBe(2);
            expect(res.body.data.responseTime.responseRatePercentage).toBe(88.5);
        } catch (error) {
            expect(error).toBeUndefined();
        }
    });

    it('GET /api/analytics/dashboard should accept valid custom date boundaries', async () => {
        try {
            jest.spyOn(AnalyticsService.prototype, 'getDashboardAnalytics').mockResolvedValue({
                overview: {
                    totalEmails: 40,
                    unreadEmails: 2,
                    sentEmails: 8,
                    starredEmails: 1,
                    draftsCount: 0,
                    activeAccountsCount: 1,
                    totalThreadsCount: 20,
                },
                volumeTrend: [],
                topSenders: [],
                responseTime: {
                    averageResponseMinutes: 0,
                    medianResponseMinutes: 0,
                    totalRepliesAnalyzed: 0,
                    responseRatePercentage: 0,
                    distribution: { under1Hour: 0, between1And4Hours: 0, between4And24Hours: 0, over24Hours: 0 },
                },
                accountSummaries: [],
                timeframe: ANALYTICS_TIMEFRAME.CUSTOM,
                startDate: '2026-06-01T00:00:00.000Z',
                endDate: '2026-06-15T23:59:59.999Z',
            });

            const res = await request(app)
                .get('/api/analytics/dashboard')
                .query({
                    timeframe: ANALYTICS_TIMEFRAME.CUSTOM,
                    startDate: '2026-06-01T00:00:00.000Z',
                    endDate: '2026-06-15T23:59:59.999Z',
                });

            expect(res.status).toBe(200);
            expect(res.body.data.timeframe).toBe(ANALYTICS_TIMEFRAME.CUSTOM);
        } catch (error) {
            expect(error).toBeUndefined();
        }
    });
});
