import { DATE_RANGE } from '@types';
import z from 'zod';

export const getAllFoldersSchema = z.object({
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

export const getFolderSchema = z.object({
    folderId: z.string(),
});

export const updateFolderBodySchema = z.object({
    accountId: z.string(),
    folderName: z.string(),
});

export type GetAllFoldersSchema = z.infer<typeof getAllFoldersSchema>;
export type GetAccountFoldersSchema = z.infer<typeof getAccountFoldersSchema>;
export type CreateFolderSchema = z.infer<typeof createFolderSchema>;
export type GetFolderSchema = z.infer<typeof getFolderSchema>;
export type UpdateFolderBodySchema = z.infer<typeof updateFolderBodySchema>;
