import { CreateEntityInput, DraftAttributes } from '@mailsense/types';
import { EmailAttachmentSchema } from '@modules/emails/email.model.js';
import mongoose, { Document, Schema } from 'mongoose';

export type DraftInput = CreateEntityInput<DraftAttributes>;
export type DraftDocument = Document & DraftAttributes;

const DraftSchema = new Schema<DraftDocument>(
    {
        userId: { type: String, required: true, index: true },
        accountId: { type: String, required: true, index: true },
        providerDraftId: { type: String, required: false },
        to: { type: [String], default: [] },
        cc: { type: [String], default: [] },
        bcc: { type: [String], default: [] },
        subject: { type: String, default: '' },
        body: { type: String, default: '' },
        bodyPlain: { type: String, default: '' },
        inReplyTo: { type: String, required: false },
        attachments: { type: [EmailAttachmentSchema], default: [] },
        lastSavedAt: { type: Date, default: Date.now },
        syncedToProvider: { type: Boolean, default: false },
    },
    { timestamps: true },
);

DraftSchema.index({ userId: 1, lastSavedAt: -1 });
DraftSchema.index({ userId: 1, accountId: 1 });

export const DraftModel = mongoose.model<DraftDocument>('Draft', DraftSchema);
