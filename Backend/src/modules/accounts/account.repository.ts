import { Account, AccountDocument, AccountInput } from './account.model.js';

export const getAccountByEmail = async (email: string) => {
    return await Account.findOne({ emailAddress: email });
};

export const createAccount = async (data: AccountInput): Promise<AccountDocument> => {
    return Account.create(data);
};

export const upsertAccount = async (data: AccountInput): Promise<AccountDocument> => {
    const filter = { emailAddress: data.emailAddress };
    const update = { ...data, updatedAt: Date.now() };
    return Account.findOneAndUpdate(filter, update, { upsert: true, new: true });
};
