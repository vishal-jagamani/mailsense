import { AnyBulkWriteOperation, FilterQuery, FlattenMaps, PipelineStage, ProjectionType, SortOrder } from 'mongoose';
import { Email, EmailDocument, EmailInput } from './email.model.js';

export class EmailRepository {
    public static async upsertEmailsInBulk(emails: Partial<EmailInput>[]) {
        if (emails.length === 0) return [];
        const ops: AnyBulkWriteOperation[] = emails.map((email) => ({
            updateOne: {
                filter: {
                    accountId: email.accountId,
                    providerMessageId: email.providerMessageId,
                },
                update: { $set: email },
                upsert: true,
            },
        }));
        return Email.bulkWrite(ops, { ordered: false });
    }

    public static async getEmailsByAccountId(
        accountId: string,
        size: number,
        page: number,
        fields: ProjectionType<EmailDocument>,
        sort: Record<string, SortOrder>,
    ): Promise<FlattenMaps<EmailDocument>[]> {
        return Email.find({ accountId }, fields)
            .skip((page - 1) * size)
            .limit(size)
            .sort(sort)
            .lean();
    }

    public static async getEmails(
        searchQuery: FilterQuery<EmailDocument>,
        size: number,
        page: number,
        fields: ProjectionType<EmailDocument>,
        sort: Record<string, SortOrder>,
    ): Promise<FlattenMaps<EmailDocument>[]> {
        return Email.find(searchQuery, fields)
            .skip((page - 1) * size)
            .limit(size)
            .sort(sort)
            .lean();
    }

    public static async getEmailsByAccountIds(
        accountIds: string[],
        size: number,
        page: number,
        fields: ProjectionType<EmailDocument>,
        sort: Record<string, SortOrder>,
    ): Promise<FlattenMaps<EmailDocument>[]> {
        return Email.find({ accountId: { $in: accountIds } }, fields)
            .skip((page - 1) * size)
            .limit(size)
            .sort(sort)
            .lean();
    }

    public static async getEmail(emailId: string) {
        return Email.findById(emailId);
    }

    public static async searchEmails(
        searchQuery: FilterQuery<EmailDocument>,
        fields: ProjectionType<EmailDocument>,
        size: number,
        page: number,
        sort: Record<string, SortOrder>,
    ) {
        return Email.find(searchQuery, fields)
            .skip((page - 1) * size)
            .limit(size)
            .sort(sort);
    }

    public static async getEmailsByProviderMessageIds(emailIds: string[], fields: ProjectionType<EmailDocument>) {
        return Email.find({ providerMessageId: { $in: emailIds } }, fields).lean();
    }

    public static async updateEmail(emailId: string, data: Partial<EmailInput>) {
        return Email.findByIdAndUpdate(emailId, data, { new: true });
    }

    public static async updateEmailByProviderMessageId(providerMessageId: string, data: Partial<EmailInput>) {
        return Email.updateOne({ providerMessageId }, { $set: data });
    }

    public static async deleteEmail(emailId: string) {
        return Email.findByIdAndDelete(emailId);
    }

    public static async deleteManyEmails(emailIds: string[]) {
        return Email.deleteMany({ providerMessageId: { $in: emailIds } });
    }

    public static async countDocuments(searchQuery: FilterQuery<EmailDocument>) {
        return Email.countDocuments(searchQuery);
    }

    public static async deleteEmailsByAccountId(accountId: string) {
        return Email.deleteMany({ accountId });
    }

    public static async getEmailsByThreadId(
        threadId: string,
        accountId: string,
        fields?: ProjectionType<EmailDocument>,
    ): Promise<FlattenMaps<EmailDocument>[]> {
        return Email.find({ threadId, accountId }, fields).sort({ receivedAt: 1 }).lean();
    }

    public static async getThreadSummaries(
        accountIds: string[],
        threadIds: string[],
    ): Promise<{ threadId: string; count: number; latestAt: Date }[]> {
        return Email.aggregate([
            { $match: { accountId: { $in: accountIds }, threadId: { $in: threadIds } } },
            { $group: { _id: '$threadId', count: { $sum: 1 }, latestAt: { $max: '$receivedAt' } } },
            { $project: { _id: 0, threadId: '$_id', count: 1, latestAt: 1 } },
        ]);
    }

    public static async getGroupedEmails(
        searchQuery: FilterQuery<EmailDocument>,
        size: number,
        page: number,
        fields: ProjectionType<EmailDocument>,
    ): Promise<(FlattenMaps<EmailDocument> & { threadCount: number })[]> {
        const pipeline: PipelineStage[] = [
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
            {
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
            },
            {
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
            },
            {
                $project: {
                    ...(typeof fields === 'object' ? fields : {}),
                    threadId: 1,
                    threadCount: 1,
                },
            },
        ];

        return Email.aggregate(pipeline);
    }

    public static async countGroupedThreads(searchQuery: FilterQuery<EmailDocument>): Promise<number> {
        const result = await Email.aggregate([
            { $match: searchQuery },
            {
                $group: {
                    _id: { $ifNull: ['$threadId', '$_id'] },
                },
            },
            { $count: 'total' },
        ]);
        return result[0]?.total || 0;
    }

    public static async getEmailsByIds(emailIds: string[]): Promise<EmailDocument[]> {
        if (!emailIds.length) return [];
        return await Email.find({ _id: { $in: emailIds } });
    }

    public static async updateFolders(emailIds: string[], targetFolderIds: string[], removeFolderIds: string[] = []): Promise<number> {
        if (!emailIds.length) return 0;

        let modifiedCount = 0;

        if (removeFolderIds.length > 0) {
            const pullResult = await Email.updateMany({ _id: { $in: emailIds } }, { $pull: { folders: { $in: removeFolderIds } } });
            modifiedCount += pullResult.modifiedCount;
        }

        if (targetFolderIds.length > 0) {
            const addResult = await Email.updateMany({ _id: { $in: emailIds } }, { $addToSet: { folders: { $each: targetFolderIds } } });
            modifiedCount = Math.max(modifiedCount, addResult.modifiedCount);
        }

        return modifiedCount;
    }
}
