import z from 'zod';

export const getEmailsSchema = z.object({
    size: z.string().optional(),
    page: z.string().optional(),
});

export const getEmailSchema = z.object({
    emailId: z.string(),
});

export const deleteEmailSchema = z.object({
    emailIds: z.array(z.string().min(1, 'Invalid email ID')).nonempty('At least one email ID is required'),
    trash: z.boolean().optional().default(false),
});

export type GetEmailsSchema = z.infer<typeof getEmailsSchema>;
export type GetEmailSchema = z.infer<typeof getEmailSchema>;
export type DeleteEmailSchema = z.infer<typeof deleteEmailSchema>;
