import { AnyBulkWriteOperation, ProjectionType } from 'mongoose';
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

    public static async getEmails(accountId: string, size: number, page: number, fields: ProjectionType<EmailDocument>) {
        return Email.find({ accountId }, fields)
            .skip((page - 1) * size)
            .limit(size)
            .lean();
    }

    public static async countDocuments(accountId: string) {
        return Email.countDocuments({ accountId });
    }

    public static async deleteEmailsByAccountId(accountId: string) {
        return Email.deleteMany({ accountId });
    }
}
