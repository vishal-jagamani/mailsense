import { CreateEntityInput, StagedAttachmentAttributes } from '@mailsense/types';
import { model, Schema } from 'mongoose';

export type StagedAttachmentDocument = StagedAttachmentAttributes & Document;
export type StagedAttachmentInput = CreateEntityInput<StagedAttachmentAttributes>;

export const StagedAttachmentSchema = new Schema<StagedAttachmentDocument>(
    {
        userId: { type: String, required: true, index: true },
        accountId: { type: String, required: true },
        r2Key: { type: String, required: true, unique: true },
        filename: { type: String, required: true },
        mimeType: { type: String, required: true },
        size: { type: Number, required: true },
        isInline: { type: Boolean, default: false },
        contentId: { type: String },
        status: {
            type: String,
            enum: ['STAGED', 'ATTACHED', 'EXPIRED'],
            default: 'STAGED',
        },
        expiresAt: { type: Date, required: true, index: { expires: 0 } },
    },
    { timestamps: true },
);

export const StagedAttachmentModel = model<StagedAttachmentDocument>('StagedAttachment', StagedAttachmentSchema);
