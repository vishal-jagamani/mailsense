import { z } from 'zod';
import { AccountProvider } from 'types/account.types.js';

export const getAccountsSchema = z.object({
    userId: z.string(),
});

export const connectAccountSchema = z.object({
    provider: z.enum(AccountProvider),
});

export const getAccountDetailsSchema = z.object({
    accountId: z.string(),
});

export const deleteAccountSchema = z.object({
    accountId: z.string(),
});

export type GetAccountsSchema = z.infer<typeof getAccountsSchema>;
export type GetAccountDetailsSchema = z.infer<typeof getAccountDetailsSchema>;
export type ConnectAccountSchema = z.infer<typeof connectAccountSchema>;
export type DeleteAccountSchema = z.infer<typeof deleteAccountSchema>;
