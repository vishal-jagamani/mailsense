import { z } from 'zod';

export const uploadStagedAttachmentSchema = z.object({
    accountId: z.string({ message: 'Account ID is required' }).min(1, 'Account ID cannot be empty'),
});

export const deleteStagedAttachmentSchema = z.object({
    attachmentId: z.string({ message: 'Attachment ID is required' }).min(1, 'Attachment ID cannot be empty'),
});

export type UploadStagedAttachmentSchema = z.infer<typeof uploadStagedAttachmentSchema>;
export type DeleteStagedAttachmentSchema = z.infer<typeof deleteStagedAttachmentSchema>;
