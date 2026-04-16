import { z } from 'zod';
import { AccountProvider } from 'types/account.types.js';

export const connectAccountSchema = z.object({
    provider: z.enum(AccountProvider),
});

export const getAccountDetailsSchema = z.object({
    accountId: z.string(),
});

export const deleteAccountSchema = z.object({
    accountId: z.string(),
});

export const enableAccountSchema = z.object({
    active: z.boolean(),
});

export type GetAccountDetailsSchema = z.infer<typeof getAccountDetailsSchema>;
export type ConnectAccountSchema = z.infer<typeof connectAccountSchema>;
export type DeleteAccountSchema = z.infer<typeof deleteAccountSchema>;
export type EnableAccountSchema = z.infer<typeof enableAccountSchema>;
export type UpdateAccountSchema = z.infer<typeof enableAccountSchema>;
