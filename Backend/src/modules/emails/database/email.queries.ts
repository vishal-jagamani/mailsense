import { FilterQuery, PipelineStage, ProjectionType } from 'mongoose';
import { EmailDocument } from './email.model.js';

export const GROUPED_EMAILS_QUERY = (
    searchQuery: FilterQuery<EmailDocument>,
    size: number,
    page: number,
    fields: ProjectionType<EmailDocument>,
): PipelineStage[] => [
    { $match: searchQuery },
    { $sort: { receivedAt: -1 } },
    {
        $group: {
            _id: { $ifNull: ['$threadId', '$_id'] },
            doc: { $first: '$$ROOT' },
        },
    },
    { $sort: { 'doc.receivedAt': -1 } },
    { $skip: (page - 1) * size },
    { $limit: size },
    EMAIL_THREAD_COUNT_LOOKUP,
    EMAIL_THREAD_COUNT_PROJECT,
    {
        $project: {
            ...(typeof fields === 'object' ? fields : {}),
            threadId: 1,
            threadCount: 1,
        },
    },
];

const EMAIL_THREAD_COUNT_LOOKUP = {
    $lookup: {
        from: 'emails',
        let: { tId: '$_id', accId: '$doc.accountId' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [{ $eq: ['$accountId', '$$accId'] }, { $eq: ['$threadId', '$$tId'] }],
                    },
                },
            },
            { $count: 'count' },
        ],
        as: 'threadStats',
    },
};

const EMAIL_THREAD_COUNT_PROJECT = {
    $replaceRoot: {
        newRoot: {
            $mergeObjects: [
                '$doc',
                {
                    threadCount: {
                        $ifNull: [{ $arrayElemAt: ['$threadStats.count', 0] }, 1],
                    },
                },
            ],
        },
    },
};
