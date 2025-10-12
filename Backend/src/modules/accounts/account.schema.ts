import { z } from 'zod';
import { AccountProvider } from 'types/account.types.js';

export const getAccountSchema = z.object({
    userId: z.string(),
});

export const connectAccountSchema = z.object({
    provider: z.enum(AccountProvider),
});

export const deleteAccountSchema = z.object({
    accountId: z.string(),
});

export type ConnectAccountSchema = z.infer<typeof connectAccountSchema>;
export type DeleteAccountSchema = z.infer<typeof deleteAccountSchema>;
