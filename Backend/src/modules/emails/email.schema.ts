import z from 'zod';
import { DATE_RANGE } from './email.types.js';

export const getAllEmailsSchema = z.object({
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

export const getEmailsSchema = z.object({
    size: z.string().optional(),
    page: z.string().optional(),
});

export const getEmailSchema = z.object({
    emailId: z.string(),
});

export const deleteEmailSchema = z.object({
    emailIds: z.array(z.string().min(1, 'Invalid email id')).nonempty('At least one email id is required'),
    trash: z.boolean().optional().default(false),
});

export const archiveEmailSchema = z.object({
    emailIds: z.array(z.string().min(1, 'Invalid email id')).nonempty('At least one email id is required'),
    archive: z.boolean().optional().default(false),
});

export const starEmailSchema = z.object({
    emailIds: z.array(z.string().min(1, 'Invalid email id')).nonempty('At least one email id is required'),
    star: z.boolean().optional().default(false),
});

export const unreadEmailSchema = z.object({
    emailIds: z.array(z.string().min(1, 'Invalid email id')).nonempty('At least one email id is required'),
    unread: z.boolean().optional().default(false),
});

export const searchEmailSchema = z.object({
    searchText: z.string().min(3, 'Search query must be at least 3 characters long'),
    size: z.string().optional(),
    page: z.string().optional(),
});

export type GetAllEmailsSchema = z.infer<typeof getAllEmailsSchema>;
export type GetEmailsSchema = z.infer<typeof getEmailsSchema>;
export type GetEmailSchema = z.infer<typeof getEmailSchema>;
export type DeleteEmailSchema = z.infer<typeof deleteEmailSchema>;
export type ArchiveEmailBody = z.infer<typeof archiveEmailSchema>;
export type StarEmailBody = z.infer<typeof starEmailSchema>;
export type UnreadEmailBody = z.infer<typeof unreadEmailSchema>;
export type SearchEmailBody = z.infer<typeof searchEmailSchema>;
