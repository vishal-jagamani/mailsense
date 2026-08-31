import { AccountMetrics } from '@modules/accounts/account.model.js';
import { DraftModel } from '@modules/drafts/draft.model.js';
import { Email } from '@modules/emails/email.model.js';
import mongoose from 'mongoose';
import { AnalyticsRepository } from '../analytics.repository.js';

jest.mock('@modules/emails/email.model.js', () => {
    const mongooseModule = jest.requireActual('mongoose') as typeof mongoose;
    return {
        Email: {
            aggregate: jest.fn(),
            countDocuments: jest.fn(),
        },
        EmailAttachmentSchema: new mongooseModule.Schema({
            id: String,
            filename: String,
            mimeType: String,
            size: Number,
        }),
    };
});

jest.mock('@modules/drafts/draft.model.js', () => ({
    DraftModel: {
        countDocuments: jest.fn(),
    },
}));

jest.mock('@modules/accounts/account.model.js', () => ({
    Account: {
        find: jest.fn(),
    },
    AccountMetrics: {
        findOneAndUpdate: jest.fn(),
    },
}));

describe('AnalyticsRepository — Unit Tests', () => {
    beforeEach(() => {
        try {
            jest.clearAllMocks();
        } catch (error) {
            console.error('Failed to clear mocks in beforeEach', error);
        }
    });

    describe('getOverviewCountsRaw', () => {
        it('should execute Email.aggregate and DraftModel.countDocuments with date boundaries', async () => {
            try {
                const mockFacetData = [
                    {
                        totalEmails: [{ count: 150 }],
                        unreadEmails: [{ count: 20 }],
                        sentEmails: [{ count: 45 }],
                        starredEmails: [{ count: 10 }],
                        threads: [{ count: 70 }],
                    },
                ];

                (Email.aggregate as jest.Mock).mockResolvedValue(mockFacetData);
                (DraftModel.countDocuments as jest.Mock).mockResolvedValue(5);

                const startDate = new Date('2026-08-01T00:00:00Z');
                const endDate = new Date('2026-08-31T23:59:59Z');

                const result = await AnalyticsRepository.getOverviewCountsRaw('usr_123', ['acc_1', 'acc_2'], startDate, endDate);

                expect(Email.aggregate).toHaveBeenCalled();
                expect(DraftModel.countDocuments).toHaveBeenCalledWith({
                    userId: 'usr_123',
                    accountId: { $in: ['acc_1', 'acc_2'] },
                });
                expect(result.facetResult).toEqual(mockFacetData[0]);
                expect(result.draftsCount).toBe(5);
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });
    });

    describe('getEmailVolumeTimeSeriesRaw', () => {
        it('should execute aggregation pipeline matching accountIds and date range', async () => {
            try {
                const mockVolume = [
                    { _id: '2026-08-01', receivedCount: 10, sentCount: 2 },
                    { _id: '2026-08-02', receivedCount: 15, sentCount: 4 },
                ];

                (Email.aggregate as jest.Mock).mockResolvedValue(mockVolume);

                const startDate = new Date('2026-08-01T00:00:00Z');
                const endDate = new Date('2026-08-02T23:59:59Z');

                const result = await AnalyticsRepository.getEmailVolumeTimeSeriesRaw(['acc_1'], startDate, endDate);

                expect(Email.aggregate).toHaveBeenCalled();
                expect(result).toEqual(mockVolume);
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });
    });

    describe('getTopSendersRaw', () => {
        it('should return aggregated sender list and total count', async () => {
            try {
                const mockSenders = [
                    { _id: 'boss@company.com', count: 30, lastReceivedAt: new Date('2026-08-28T10:00:00Z') },
                ];

                (Email.aggregate as jest.Mock).mockResolvedValue(mockSenders);
                (Email.countDocuments as jest.Mock).mockResolvedValue(50);

                const result = await AnalyticsRepository.getTopSendersRaw(['acc_1'], undefined, undefined, 5);

                expect(Email.aggregate).toHaveBeenCalled();
                expect(Email.countDocuments).toHaveBeenCalled();
                expect(result.senders).toEqual(mockSenders);
                expect(result.totalIncoming).toBe(50);
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });
    });

    describe('getResponseTimeStatsRaw', () => {
        it('should execute thread aggregation pipeline filtering hasReceived threads', async () => {
            try {
                const mockThreadStats = [
                    {
                        _id: 'thread_1',
                        firstReceivedAt: new Date('2026-08-10T10:00:00Z'),
                        firstSentAt: new Date('2026-08-10T10:30:00Z'),
                        hasReceived: true,
                        hasSent: true,
                    },
                ];

                (Email.aggregate as jest.Mock).mockResolvedValue(mockThreadStats);

                const result = await AnalyticsRepository.getResponseTimeStatsRaw(['acc_1']);

                expect(Email.aggregate).toHaveBeenCalled();
                expect(result).toEqual(mockThreadStats);
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });
    });

    describe('getAccountSyncMetricsRaw', () => {
        it('should compute sync counts and thread metrics', async () => {
            try {
                (Email.countDocuments as jest.Mock)
                    .mockResolvedValueOnce(300) // total
                    .mockResolvedValueOnce(25)  // unread
                    .mockResolvedValueOnce(75); // sent

                (Email.aggregate as jest.Mock).mockResolvedValue([{ count: 120 }]);

                const result = await AnalyticsRepository.getAccountSyncMetricsRaw('acc_1');

                expect(result.totalEmails).toBe(300);
                expect(result.unreadCount).toBe(25);
                expect(result.sentCount).toBe(75);
                expect(result.totalThreads).toBe(120);
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });
    });

    describe('upsertDailyAccountMetrics', () => {
        it('should invoke findOneAndUpdate on AccountMetrics with upsert option', async () => {
            try {
                const mockDoc = { _id: 'metric_1', accountId: 'acc_1', totalEmails: 300 };
                (AccountMetrics.findOneAndUpdate as jest.Mock).mockResolvedValue(mockDoc);

                const result = await AnalyticsRepository.upsertDailyAccountMetrics('acc_1', { totalEmails: 300 });

                expect(AccountMetrics.findOneAndUpdate).toHaveBeenCalledWith(
                    expect.objectContaining({ accountId: 'acc_1' }),
                    expect.objectContaining({
                        $set: expect.objectContaining({ accountId: 'acc_1', totalEmails: 300 }),
                    }),
                    { upsert: true, new: true },
                );
                expect(result).toEqual(mockDoc);
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });
    });
});
