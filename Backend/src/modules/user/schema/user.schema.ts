import { ACCOUNT_SYNC_MODE } from '@mailsense/types';
import z from 'zod';

export const updateUserSchema = z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    role: z.string().optional(),
});

export const changePasswordSchema = z.object({
    password: z.string(),
});

export const userAccountSyncSettingsSchema = z.object({
    globalAutoSync: z.boolean().optional(),
    syncMode: z.enum(ACCOUNT_SYNC_MODE).optional(),
    globalSyncInterval: z.number().positive().optional(),
    defaultSyncInterval: z.number().positive().optional(),
});

export const updateUserSettingsSchema = z.object({
    account: z
        .object({
            syncSettings: userAccountSyncSettingsSchema.optional(),
        })
        .optional(),
});

export type UpdateUserSchema = z.infer<typeof updateUserSchema>;
export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;
export type UpdateUserSettingsSchema = z.infer<typeof updateUserSettingsSchema>;
