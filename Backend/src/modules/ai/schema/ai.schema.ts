import z from 'zod';

export const getEmailSummaryParamsSchema = z.object({
    emailId: z.string().min(1, 'Email ID is required'),
});

export const getSuggestedRepliesParamsSchema = z.object({
    emailId: z.string().min(1, 'Email ID is required'),
});

export type GetEmailSummaryParamsSchema = z.infer<typeof getEmailSummaryParamsSchema>;
export type GetSuggestedRepliesParamsSchema = z.infer<typeof getSuggestedRepliesParamsSchema>;
