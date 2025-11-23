import z from 'zod';

export const getAllEmailsSchema = z.object({
    userid: z.string(),
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

export type GetAllEmailsSchema = z.infer<typeof getAllEmailsSchema>;
export type GetEmailsSchema = z.infer<typeof getEmailsSchema>;
export type GetEmailSchema = z.infer<typeof getEmailSchema>;
export type DeleteEmailSchema = z.infer<typeof deleteEmailSchema>;
export type ArchiveEmailBody = z.infer<typeof archiveEmailSchema>;
