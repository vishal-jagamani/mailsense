import { ACCOUNT_SYNC_MODE } from '@mailsense/types';
import z from 'zod';

export const userMetadataSchema = z.object({
    phone_number: z.string().optional(),
});

export const updateUserSchema = z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    role: z.string().optional(),
    nickname: z.string().optional(),
    picture: z.string().optional(),
    email_verified: z.boolean().optional(),
    sub: z.string().optional(),
    user_metadata: userMetadataSchema.optional(),
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

export const userAiFeatureSettingsSchema = z.object({
    categorization: z.boolean().optional(),
    priorityScoring: z.boolean().optional(),
    summarization: z.boolean().optional(),
    suggestedReplies: z.boolean().optional(),
});

export const updateUserAiSettingsSchema = z.object({
    enabled: z.boolean().optional(),
    features: userAiFeatureSettingsSchema.optional(),
    disabledAccountIds: z.array(z.string()).optional(),
});

export type UpdateUserSchema = z.infer<typeof updateUserSchema>;
export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;
export type UpdateUserSettingsSchema = z.infer<typeof updateUserSettingsSchema>;
export type UpdateUserAiSettingsSchema = z.infer<typeof updateUserAiSettingsSchema>;
