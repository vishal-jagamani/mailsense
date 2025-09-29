import { AnyBulkWriteOperation } from 'mongoose';
import { Email, EmailInput } from './email.model.js';

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

    public static async getEmails(accountId: string, size: number, page: number) {
        return Email.find({ accountId })
            .skip((page - 1) * size)
            .limit(size)
            .lean();
    }

    public static async countDocuments(accountId: string) {
        return Email.countDocuments({ accountId });
    }
}
