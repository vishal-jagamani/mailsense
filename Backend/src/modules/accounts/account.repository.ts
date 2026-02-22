import { FilterQuery, ProjectionType } from 'mongoose';
import { Account, AccountDocument, AccountInput, AccountMetrics, AccountMetricsDocument, AccountMetricsInput } from './account.model.js';

export class AccountRepository {
    public static async getAccounts(userId: string) {
        return await Account.find({ userId });
    }

    public static async getAccountByEmail(emailAddress: string) {
        return await Account.findOne({ emailAddress });
    }

    public static async createAccount(data: AccountInput): Promise<AccountDocument> {
        return Account.create(data);
    }

    public static async upsertAccount(data: Partial<AccountInput>): Promise<AccountDocument> {
        const filter = { emailAddress: data.emailAddress };
        const update = { ...data, updatedAt: Date.now() };
        return Account.findOneAndUpdate(filter, update, { upsert: true, new: true });
    }

    public static async getAccountById(id: string, fields?: ProjectionType<AccountDocument>) {
        return await Account.findById(id, fields);
    }

    public static async updateAccountAccessToken(id: string, accessToken: string, accessTokenExpiry: number) {
        return await Account.findByIdAndUpdate(id, { accessToken, accessTokenExpiry }, { new: true });
    }

    public static async updateAccount(id: string, data: Partial<AccountInput>) {
        return await Account.findByIdAndUpdate(id, data, { new: true });
    }

    public static async deleteAccount(id: string) {
        return await Account.findByIdAndDelete(id);
    }

    public static async getAccountMetrics(accountId: string, filter?: FilterQuery<AccountMetricsDocument>) {
        return await AccountMetrics.find({ accountId }, filter);
    }

    public static async createAccountMetrics(data: AccountMetricsInput): Promise<AccountMetricsDocument> {
        return AccountMetrics.create(data);
    }
}
