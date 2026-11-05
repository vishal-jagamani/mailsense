import { AccountMetricsAttributes } from '@mailsense/types';
import { Account, AccountMetrics, AccountMetricsDocument } from '@modules/accounts/account.model.js';
import { DraftModel } from '@modules/drafts/draft.model.js';
import { Email, EmailDocument } from '@modules/emails/database/email.model.js';
import { FilterQuery, PipelineStage } from 'mongoose';
import { EXCLUDED_INCOMING_FOLDERS, SENT_FOLDER_IDENTIFIERS } from '../analytics.constants.js';
import {
    AccountEmailMetricsResult,
    RawAccountBreakdownResult,
    RawOverviewAggregateResult,
    RawOverviewFacetResult,
    RawThreadResponseTimeSummary,
    RawTopSendersResult,
    RawVolumeDataPoint,
} from '../analytics.types.js';
import {
    ACCOUNT_BREAKDOWN_RAW_QUERY,
    EMAIL_VOLUME_TIME_SERIES_RAW_QUERY,
    OVERVIEW_COUNT_RAW_QUERY,
    RESPONSE_TIME_STATS_RAW_QUERY,
} from './analytics.queries.js';

export class AnalyticsRepository {
    public static async getOverviewCountsRaw(
        userId: string,
        accountIds: string[],
        startDate?: Date,
        endDate?: Date,
    ): Promise<RawOverviewAggregateResult> {
        const matchFilter: FilterQuery<EmailDocument> = {
            accountId: { $in: accountIds },
        };

        if (startDate || endDate) {
            matchFilter.receivedAt = {};
            if (startDate) {
                matchFilter.receivedAt.$gte = startDate;
            }
            if (endDate) {
                matchFilter.receivedAt.$lte = endDate;
            }
        }

        const [emailStats, draftsCount, allTimeTotalEmails] = await Promise.all([
            Email.aggregate<RawOverviewFacetResult>(OVERVIEW_COUNT_RAW_QUERY(matchFilter)),
            DraftModel.countDocuments({ userId, accountId: { $in: accountIds } }),
            Email.countDocuments({ accountId: { $in: accountIds } }),
        ]);

        const facetResult = emailStats[0] || {};
        const periodEmailsCount = facetResult.totalEmails?.[0]?.count ?? 0;

        return { facetResult, draftsCount, allTimeTotalEmails, periodEmailsCount };
    }

    public static async getEmailVolumeTimeSeriesRaw(accountIds: string[], startDate: Date, endDate: Date): Promise<RawVolumeDataPoint[]> {
        return Email.aggregate<RawVolumeDataPoint>(EMAIL_VOLUME_TIME_SERIES_RAW_QUERY(accountIds, startDate, endDate));
    }

    public static async getTopSendersRaw(accountIds: string[], startDate?: Date, endDate?: Date, limit: number = 5): Promise<RawTopSendersResult> {
        const matchFilter: FilterQuery<EmailDocument> = {
            accountId: { $in: accountIds },
            folders: { $nin: SENT_FOLDER_IDENTIFIERS },
        };

        if (startDate || endDate) {
            matchFilter.receivedAt = {};
            if (startDate) {
                matchFilter.receivedAt.$gte = startDate;
            }
            if (endDate) {
                matchFilter.receivedAt.$lte = endDate;
            }
        }

        const pipeline: PipelineStage[] = [
            { $match: matchFilter },
            { $group: { _id: '$from', count: { $sum: 1 }, lastReceivedAt: { $max: '$receivedAt' } } },
            { $sort: { count: -1 } },
            { $limit: limit },
        ];

        const [senders, totalIncoming] = await Promise.all([
            Email.aggregate<RawTopSendersResult['senders'][number]>(pipeline),
            Email.countDocuments(matchFilter),
        ]);

        return { senders, totalIncoming };
    }

    public static async getResponseTimeStatsRaw(accountIds: string[], startDate?: Date, endDate?: Date): Promise<RawThreadResponseTimeSummary[]> {
        const matchFilter: FilterQuery<EmailDocument> = {
            accountId: { $in: accountIds },
            threadId: { $exists: true, $ne: '' },
        };

        if (startDate || endDate) {
            matchFilter.receivedAt = {};
            if (startDate) {
                matchFilter.receivedAt.$gte = startDate;
            }
            if (endDate) {
                matchFilter.receivedAt.$lte = endDate;
            }
        }

        return Email.aggregate<RawThreadResponseTimeSummary>(RESPONSE_TIME_STATS_RAW_QUERY(matchFilter));
    }

    public static async getAccountBreakdownRaw(accountIds: string[]): Promise<RawAccountBreakdownResult> {
        const [accounts, emailStats] = await Promise.all([
            Account.find({ _id: { $in: accountIds } }).lean(),
            Email.aggregate<RawAccountBreakdownResult['emailStats'][number]>(ACCOUNT_BREAKDOWN_RAW_QUERY(accountIds)),
        ]);

        return { accounts, emailStats };
    }

    public static async getAccountSyncMetricsRaw(accountId: string): Promise<AccountEmailMetricsResult> {
        const [totalEmails, unreadCount, sentCount, threadsResult] = await Promise.all([
            Email.countDocuments({ accountId }),
            Email.countDocuments({
                accountId,
                isRead: false,
                folders: { $nin: EXCLUDED_INCOMING_FOLDERS },
            }),
            Email.countDocuments({
                accountId,
                folders: { $in: SENT_FOLDER_IDENTIFIERS },
            }),
            Email.aggregate([{ $match: { accountId, threadId: { $exists: true, $ne: '' } } }, { $group: { _id: '$threadId' } }, { $count: 'count' }]),
        ]);

        const totalThreads = threadsResult?.[0]?.count ?? 0;

        return { totalEmails, unreadCount, sentCount, totalThreads };
    }

    public static async upsertDailyAccountMetrics(
        accountId: string,
        metrics: Partial<AccountMetricsAttributes>,
    ): Promise<AccountMetricsDocument | null> {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        return AccountMetrics.findOneAndUpdate(
            { accountId, date: { $gte: startOfDay } },
            { $set: { ...metrics, accountId, date: new Date() } },
            { upsert: true, new: true },
        );
    }
}
