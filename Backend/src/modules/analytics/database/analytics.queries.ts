import { EmailDocument } from '@modules/emails/database/email.model.js';
import { FilterQuery, PipelineStage } from 'mongoose';
import { EXCLUDED_INCOMING_FOLDERS, SENT_FOLDER_IDENTIFIERS, STARRED_FOLDER_IDENTIFIERS } from '../analytics.constants.js';

export const OVERVIEW_COUNT_RAW_QUERY = (matchFilter: FilterQuery<EmailDocument>): PipelineStage[] => [
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
            threads: [
                {
                    $match: { threadId: { $exists: true, $ne: '' } },
                },
                { $group: { _id: '$threadId' } },
                { $count: 'count' },
            ],
        },
    },
];

export const EMAIL_VOLUME_TIME_SERIES_RAW_QUERY = (accountIds: string[], startDate: Date, endDate: Date): PipelineStage[] => [
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

export const RESPONSE_TIME_STATS_RAW_QUERY = (matchFilter: FilterQuery<EmailDocument>): PipelineStage[] => [
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

export const ACCOUNT_BREAKDOWN_RAW_QUERY = (accountIds: string[]): PipelineStage[] => [
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
];
