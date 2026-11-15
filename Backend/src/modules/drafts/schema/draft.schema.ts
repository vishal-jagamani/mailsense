import z from 'zod';

export const saveDraftSchema = z.object({
    draftId: z.string().optional(),
    accountId: z.string(),
    to: z.array(z.string()).default([]),
    cc: z.array(z.string()).optional(),
    bcc: z.array(z.string()).optional(),
    subject: z.string().optional(),
    body: z.string().optional(),
    inReplyTo: z.string().optional(),
});

export const draftParamSchema = z.object({
    draftId: z.string(),
});

export type SaveDraftRequestBody = z.infer<typeof saveDraftSchema>;
export type DraftParamSchema = z.infer<typeof draftParamSchema>;
