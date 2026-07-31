import { ACCOUNT_PROVIDER } from '@mailsense/types';
import { z } from 'zod';

export const connectAccountSchema = z.object({
    provider: z.enum(ACCOUNT_PROVIDER),
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

export const updateAccountSettingsSchema = z.object({
    syncEnabled: z.boolean().optional(),
    syncInterval: z.number().positive().optional(),
    active: z.boolean().optional(),
});

export type GetAccountDetailsSchema = z.infer<typeof getAccountDetailsSchema>;
export type ConnectAccountSchema = z.infer<typeof connectAccountSchema>;
export type DeleteAccountSchema = z.infer<typeof deleteAccountSchema>;
export type EnableAccountSchema = z.infer<typeof enableAccountSchema>;
export type UpdateAccountSchema = z.infer<typeof enableAccountSchema>;
export type UpdateAccountSettingsSchema = z.infer<typeof updateAccountSettingsSchema>;
