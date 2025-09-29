import z from 'zod';

export const getEmailsSchema = z.object({
    size: z.string().optional(),
    page: z.string().optional(),
});

export type GetEmailsSchema = z.infer<typeof getEmailsSchema>;
