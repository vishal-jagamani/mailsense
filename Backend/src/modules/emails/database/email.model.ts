import { EmailAttributes } from '@mailsense/types';
import { Document, model, Schema } from 'mongoose';

export type EmailInput = Omit<EmailAttributes, '_id' | 'createdAt' | 'updatedAt'>;
export type EmailDocument = Document & EmailAttributes;

export const EmailAttachmentSchema = new Schema(
    {
        attachmentId: { type: String, required: true },
        filename: { type: String, required: true },
        mimeType: { type: String, required: true },
        size: { type: Number, required: true },
        contentId: { type: String },
        isInline: { type: Boolean, required: true, default: false },
    },
    { _id: false },
);

const EmailSchema = new Schema<EmailDocument>(
    {
        accountId: { type: String, required: true },
        providerMessageId: { type: String, required: true },
        threadId: { type: String, required: true },
        from: { type: String, required: true },
        to: { type: [String], required: true },
        cc: { type: [String], required: true },
        bcc: { type: [String], required: true },
        subject: { type: String, required: true },
        body: { type: String, required: true },
        bodyHtml: { type: String, required: true },
        bodyPlain: { type: String, required: true },
        receivedAt: { type: Date, required: true },
        isRead: { type: Boolean, required: true },
        folders: { type: [String], required: true },
        attachments: { type: [EmailAttachmentSchema], default: [] },
    },
    { timestamps: true, versionKey: false },
);

// Indexes
EmailSchema.index({ accountId: 1, providerMessageId: 1 }, { unique: true });
EmailSchema.index({ accountId: 1, receivedAt: -1 });
EmailSchema.index({ accountId: 1, folders: 1, receivedAt: -1 });
EmailSchema.index({ accountId: 1, isRead: 1 });
EmailSchema.index({ accountId: 1, from: 1 });
EmailSchema.index({ accountId: 1, threadId: 1, receivedAt: 1 });

export const Email = model<EmailDocument>('Email', EmailSchema);
