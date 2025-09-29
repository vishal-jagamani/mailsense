import { z } from 'zod';
import { AccountProvider } from 'types/account.types.js';

export const getAccountSchema = z.object({
    userId: z.string(),
});

export const connectAccountSchema = z.object({
    provider: z.enum(AccountProvider),
});

export type ConnectAccountSchema = z.infer<typeof connectAccountSchema>;
