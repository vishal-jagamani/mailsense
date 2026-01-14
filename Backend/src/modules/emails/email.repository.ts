import { AnyBulkWriteOperation, FilterQuery, FlattenMaps, ProjectionType, SortOrder } from 'mongoose';
import { Email, EmailDocument, EmailInput } from './email.model.js';

export class EmailRepository {
    public static async upsertEmailsInBulk(emails: EmailInput[]) {
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

    public static async searchEmails(searchQuery: FilterQuery<EmailDocument>, fields: ProjectionType<EmailDocument>) {
        return Email.find(searchQuery, fields);
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

    public static async countDocuments(accountIds: string[]) {
        return Email.countDocuments({ accountId: { $in: accountIds } });
    }

    public static async deleteEmailsByAccountId(accountId: string) {
        return Email.deleteMany({ accountId });
    }
}
