import { AccountMetricsAttributes } from '@mailsense/types';
import { Account, AccountMetrics, AccountMetricsDocument } from '@modules/accounts/account.model.js';
import { DraftModel } from '@modules/drafts/draft.model.js';
import { Email, EmailDocument } from '@modules/emails/email.model.js';
import { FilterQuery, PipelineStage } from 'mongoose';
import { EXCLUDED_INCOMING_FOLDERS, SENT_FOLDER_IDENTIFIERS, STARRED_FOLDER_IDENTIFIERS } from './analytics.constants.js';
import {
    AccountEmailMetricsResult,
    RawAccountBreakdownResult,
    RawOverviewAggregateResult,
    RawOverviewFacetResult,
    RawThreadResponseTimeSummary,
    RawTopSendersResult,
    RawVolumeDataPoint,
} from './analytics.types.js';

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

        const aggregationPipeline: PipelineStage[] = [
            { $match: matchFilter },
            {
                $facet: {
                    totalEmails: [{ $count: 'count' }],
                    unreadEmails: [
                        {
                            $match: {
                                isRead: false,
                                folders: { $nin: EXCLUDED_INCOMING_FOLDERS },
                            },
                        },
                        { $count: 'count' },
                    ],
                    sentEmails: [
                        {
                            $match: {
                                folders: { $in: SENT_FOLDER_IDENTIFIERS },
                            },
                        },
                        { $count: 'count' },
                    ],
                    starredEmails: [
                        {
                            $match: {
                                folders: { $in: STARRED_FOLDER_IDENTIFIERS },
                            },
                        },
                        { $count: 'count' },
                    ],
                    threads: [{ $match: { threadId: { $exists: true, $ne: '' } } }, { $group: { _id: '$threadId' } }, { $count: 'count' }],
                },
            },
        ];

        const [emailStats, draftsCount] = await Promise.all([
            Email.aggregate<RawOverviewFacetResult>(aggregationPipeline),
            DraftModel.countDocuments({ userId, accountId: { $in: accountIds } }),
        ]);

        return { facetResult: emailStats[0] || {}, draftsCount };
    }

    public static async getEmailVolumeTimeSeriesRaw(accountIds: string[], startDate: Date, endDate: Date): Promise<RawVolumeDataPoint[]> {
        const pipeline: PipelineStage[] = [
            { $match: { accountId: { $in: accountIds }, receivedAt: { $gte: startDate, $lte: endDate } } },
            {
                $project: {
                    dateStr: { $dateToString: { format: '%Y-%m-%d', date: '$receivedAt' } },
                    isSent: { $gt: [{ $size: { $setIntersection: ['$folders', SENT_FOLDER_IDENTIFIERS] } }, 0] },
                },
            },
            { $group: { _id: { date: '$dateStr', isSent: '$isSent' }, count: { $sum: 1 } } },
            {
                $group: {
                    _id: '$_id.date',
                    receivedCount: { $sum: { $cond: [{ $eq: ['$_id.isSent', false] }, '$count', 0] } },
                    sentCount: { $sum: { $cond: [{ $eq: ['$_id.isSent', true] }, '$count', 0] } },
                },
            },
            { $sort: { _id: 1 } },
        ];

        return Email.aggregate<RawVolumeDataPoint>(pipeline);
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

        const pipeline: PipelineStage[] = [
            { $match: matchFilter },
            {
                $project: {
                    threadId: '$threadId',
                    receivedAt: '$receivedAt',
                    isSent: { $gt: [{ $size: { $setIntersection: ['$folders', SENT_FOLDER_IDENTIFIERS] } }, 0] },
                },
            },
            { $sort: { receivedAt: 1 } },
            {
                $group: {
                    _id: '$threadId',
                    firstReceivedAt: { $min: { $cond: [{ $eq: ['$isSent', false] }, '$receivedAt', null] } },
                    firstSentAt: { $min: { $cond: [{ $eq: ['$isSent', true] }, '$receivedAt', null] } },
                    hasReceived: { $max: { $cond: [{ $eq: ['$isSent', false] }, true, false] } },
                    hasSent: { $max: { $cond: [{ $eq: ['$isSent', true] }, true, false] } },
                },
            },
            { $match: { hasReceived: true } },
        ];

        return Email.aggregate<RawThreadResponseTimeSummary>(pipeline);
    }

    public static async getAccountBreakdownRaw(accountIds: string[]): Promise<RawAccountBreakdownResult> {
        const [accounts, emailStats] = await Promise.all([
            Account.find({ _id: { $in: accountIds } }).lean(),
            Email.aggregate<RawAccountBreakdownResult['emailStats'][number]>([
                { $match: { accountId: { $in: accountIds } } },
                {
                    $group: {
                        _id: '$accountId',
                        totalEmails: { $sum: 1 },
                        unreadEmails: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $eq: ['$isRead', false] },
                                            { $eq: [{ $size: { $setIntersection: ['$folders', EXCLUDED_INCOMING_FOLDERS] } }, 0] },
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                        sentEmails: {
                            $sum: {
                                $cond: [{ $gt: [{ $size: { $setIntersection: ['$folders', SENT_FOLDER_IDENTIFIERS] } }, 0] }, 1, 0],
                            },
                        },
                    },
                },
            ]),
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
            Email.aggregate<{ count: number }>([
                { $match: { accountId, threadId: { $exists: true, $ne: '' } } },
                { $group: { _id: '$threadId' } },
                { $count: 'count' },
            ]),
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
