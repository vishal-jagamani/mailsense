import { AnyBulkWriteOperation, ProjectionType, SortOrder } from 'mongoose';
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
    ) {
        return Email.find({ accountId }, fields)
            .skip((page - 1) * size)
            .limit(size)
            .sort(sort)
            .lean();
    }

    public static async getEmail(emailId: string) {
        return Email.findById(emailId);
    }

    public static async getEmailsByProviderMessageIds(emailIds: string[]) {
        return Email.find({ providerMessageId: { $in: emailIds } });
    }

    public static async updateEmail(emailId: string, data: Partial<EmailInput>) {
        return Email.findByIdAndUpdate(emailId, data, { new: true });
    }

    public static async deleteEmail(emailId: string) {
        return Email.findByIdAndDelete(emailId);
    }

    public static async countDocuments(accountId: string) {
        return Email.countDocuments({ accountId });
    }

    public static async deleteEmailsByAccountId(accountId: string) {
        return Email.deleteMany({ accountId });
    }
}
