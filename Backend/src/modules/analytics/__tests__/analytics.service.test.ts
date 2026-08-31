import {
    ACCOUNT_PROVIDER,
    AccountAttributes,
    ANALYTICS_TIMEFRAME,
    DashboardAnalyticsResponse,
    GmailUserProfile,
    OutlookUserProfile,
} from '@mailsense/types';
import { AccountRepository } from '../../accounts/account.repository.js';
import { AnalyticsRepository } from '../analytics.repository.js';
import { AnalyticsService } from '../analytics.service.js';

jest.mock('../../accounts/account.repository.js');
jest.mock('../analytics.repository.js');

describe('AnalyticsService — Unit & Scenario Tests', () => {
    let analyticsService: AnalyticsService;
    const mockUserId = 'usr_test_123';

    const mockGmailProfile: GmailUserProfile = {
        sub: 'sub_123',
        name: 'Test Gmail User',
        given_name: 'Test',
        family_name: 'User',
        picture: 'https://example.com/pic.jpg',
        email: 'test.gmail@example.com',
        email_verified: true,
        locale: 'en',
    };

    const mockOutlookProfile: OutlookUserProfile = {
        id: 'out_p2',
        displayName: 'Test Outlook',
        givenName: 'Test',
        surname: 'Outlook',
        mail: 'test.outlook@example.com',
    };

    const mockAccounts: AccountAttributes[] = [
        {
            _id: 'acc_gmail_1',
            userId: mockUserId,
            provider: ACCOUNT_PROVIDER.GMAIL,
            emailAddress: 'test.gmail@example.com',
            userProfileDetails: mockGmailProfile,
            accessToken: 'token_1',
            refreshToken: 'refresh_1',
            accessTokenExpiry: Date.now() + 3600000,
            refreshTokenExpiry: Date.now() + 7200000,
            scope: 'email',
            syncEnabled: true,
            syncInterval: 15,
            lastSyncedAt: Date.now(),
            active: true,
            syncInProgress: false,
        },
        {
            _id: 'acc_outlook_2',
            userId: mockUserId,
            provider: ACCOUNT_PROVIDER.OUTLOOK,
            emailAddress: 'test.outlook@example.com',
            userProfileDetails: mockOutlookProfile,
            accessToken: 'token_2',
            refreshToken: 'refresh_2',
            accessTokenExpiry: Date.now() + 3600000,
            refreshTokenExpiry: Date.now() + 7200000,
            scope: 'email',
            syncEnabled: true,
            syncInterval: 15,
            lastSyncedAt: Date.now(),
            active: true,
            syncInProgress: false,
        },
    ];

    beforeEach(() => {
        try {
            jest.clearAllMocks();
            analyticsService = new AnalyticsService();
        } catch (error) {
            console.error('Failed to initialize AnalyticsService in beforeEach', error);
        }
    });

    it('should return instant zero-data envelope when user has no active accounts', async () => {
        try {
            (AccountRepository.getAccounts as jest.Mock).mockResolvedValue([]);

            const response: DashboardAnalyticsResponse = await analyticsService.getDashboardAnalytics(mockUserId, {
                timeframe: ANALYTICS_TIMEFRAME.THIRTY_DAYS,
            });

            expect(response.overview.activeAccountsCount).toBe(0);
            expect(response.overview.totalEmails).toBe(0);
            expect(response.volumeTrend.length).toBe(0);
        } catch (error) {
            expect(error).toBeUndefined();
        }
    });

    it('should resolve and aggregate across all user accounts when accountId is omitted', async () => {
        try {
            (AccountRepository.getAccounts as jest.Mock).mockResolvedValue(mockAccounts);

            (AnalyticsRepository.getOverviewCountsRaw as jest.Mock).mockResolvedValue({
                facetResult: {
                    totalEmails: [{ count: 120 }],
                    unreadEmails: [{ count: 15 }],
                    sentEmails: [{ count: 35 }],
                    starredEmails: [{ count: 8 }],
                    threads: [{ count: 65 }],
                },
                draftsCount: 3,
            });

            (AnalyticsRepository.getEmailVolumeTimeSeriesRaw as jest.Mock).mockResolvedValue([]);
            (AnalyticsRepository.getTopSendersRaw as jest.Mock).mockResolvedValue({ senders: [], totalIncoming: 0 });
            (AnalyticsRepository.getResponseTimeStatsRaw as jest.Mock).mockResolvedValue([]);
            (AnalyticsRepository.getAccountBreakdownRaw as jest.Mock).mockResolvedValue({
                accounts: mockAccounts,
                emailStats: [],
            });

            const response: DashboardAnalyticsResponse = await analyticsService.getDashboardAnalytics(mockUserId, {
                timeframe: ANALYTICS_TIMEFRAME.SEVEN_DAYS,
            });

            expect(response.overview.totalEmails).toBe(120);
            expect(response.overview.unreadEmails).toBe(15);
            expect(response.overview.sentEmails).toBe(35);
            expect(response.overview.activeAccountsCount).toBe(2);
            expect(response.accountSummaries.length).toBe(2);
        } catch (error) {
            expect(error).toBeUndefined();
        }
    });

    it('should isolate aggregation to the requested accountId when supplied', async () => {
        try {
            (AccountRepository.getAccounts as jest.Mock).mockResolvedValue(mockAccounts);

            (AnalyticsRepository.getOverviewCountsRaw as jest.Mock).mockResolvedValue({
                facetResult: {
                    totalEmails: [{ count: 50 }],
                    unreadEmails: [{ count: 5 }],
                    sentEmails: [{ count: 10 }],
                    starredEmails: [{ count: 2 }],
                    threads: [{ count: 25 }],
                },
                draftsCount: 1,
            });

            (AnalyticsRepository.getEmailVolumeTimeSeriesRaw as jest.Mock).mockResolvedValue([]);
            (AnalyticsRepository.getTopSendersRaw as jest.Mock).mockResolvedValue({ senders: [], totalIncoming: 0 });
            (AnalyticsRepository.getResponseTimeStatsRaw as jest.Mock).mockResolvedValue([]);
            (AnalyticsRepository.getAccountBreakdownRaw as jest.Mock).mockResolvedValue({
                accounts: [mockAccounts[0]],
                emailStats: [],
            });

            const response: DashboardAnalyticsResponse = await analyticsService.getDashboardAnalytics(mockUserId, {
                accountId: 'acc_gmail_1',
                timeframe: ANALYTICS_TIMEFRAME.THIRTY_DAYS,
            });

            expect(AnalyticsRepository.getOverviewCountsRaw).toHaveBeenCalledWith(mockUserId, ['acc_gmail_1'], expect.any(Date), expect.any(Date));
            expect(response.overview.totalEmails).toBe(50);
            expect(response.overview.activeAccountsCount).toBe(1);
        } catch (error) {
            expect(error).toBeUndefined();
        }
    });

    it('should throw error when requested account does not belong to the user', async () => {
        try {
            (AccountRepository.getAccounts as jest.Mock).mockResolvedValue(mockAccounts);

            await expect(
                analyticsService.getDashboardAnalytics(mockUserId, {
                    accountId: 'acc_unauthorized_999',
                    timeframe: ANALYTICS_TIMEFRAME.THIRTY_DAYS,
                }),
            ).rejects.toThrow('Requested account does not belong to the user or is inactive');
        } catch (error) {
            expect(error).toBeUndefined();
        }
    });

    it('should successfully compute and upsert daily snapshot on refreshAccountMetrics', async () => {
        try {
            (AnalyticsRepository.getAccountSyncMetricsRaw as jest.Mock).mockResolvedValue({
                totalEmails: 250,
                unreadCount: 12,
                sentCount: 65,
                totalThreads: 110,
            });

            (AnalyticsRepository.upsertDailyAccountMetrics as jest.Mock).mockResolvedValue(null);

            await analyticsService.refreshAccountMetrics('acc_gmail_1');

            expect(AnalyticsRepository.getAccountSyncMetricsRaw).toHaveBeenCalledWith('acc_gmail_1');
            expect(AnalyticsRepository.upsertDailyAccountMetrics).toHaveBeenCalledWith(
                'acc_gmail_1',
                expect.objectContaining({
                    totalEmails: 250,
                    unreadCount: 12,
                    sentCount: 65,
                    totalThreads: 110,
                }),
            );
        } catch (error) {
            expect(error).toBeUndefined();
        }
    });
});
