import { Account, AccountDocument, AccountInput } from './account.model.js';

export const getAccountByEmail = async (email: string) => {
    return await Account.findOne({ emailAddress: email });
};

export const createAccount = async (data: AccountInput): Promise<AccountDocument> => {
    return Account.create(data);
};
