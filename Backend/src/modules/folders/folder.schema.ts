import { DATE_RANGE } from '@modules/emails/email.types.js';
import z from 'zod';

export const getAllFoldersSchema = z.object({
    userId: z.string(),
    size: z.number(),
    page: z.number(),
    filters: z
        .object({
            searchText: z.string().optional(),
            accountId: z.array(z.string()).optional(),
            dateRange: z.enum(Object.values(DATE_RANGE) as [string, ...string[]]).optional(),
        })
        .optional(),
});

export const getAccountFoldersSchema = z.object({
    accountId: z.string(),
});

export const createFolderSchema = z.object({
    accountId: z.string(),
    folderName: z.string(),
});

export const updateFolderParamsSchema = z.object({
    folderId: z.string(),
});

export const updateFolderBodySchema = z.object({
    accountId: z.string(),
    folderName: z.string(),
});

export type GetAllFoldersSchema = z.infer<typeof getAllFoldersSchema>;
export type GetAccountFoldersSchema = z.infer<typeof getAccountFoldersSchema>;
export type CreateFolderSchema = z.infer<typeof createFolderSchema>;
export type UpdateFolderParamsSchema = z.infer<typeof updateFolderParamsSchema>;
export type UpdateFolderBodySchema = z.infer<typeof updateFolderBodySchema>;
