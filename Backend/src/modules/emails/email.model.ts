import { Document, model, Schema } from 'mongoose';
import { EmailAttributes } from './email.types.js';

export type EmailInput = Omit<EmailAttributes, 'createdAt' | 'updatedAt'>;

export type EmailDocument = Document & EmailAttributes;

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
        folder: { type: String, required: true },
    },
    { timestamps: true, versionKey: false },
);

// Indexes
EmailSchema.index({ accountId: 1, providerMessageId: 1 }, { unique: true });
EmailSchema.index({ accountId: 1, receivedAt: -1 });
EmailSchema.index({ accountId: 1, folder: 1, receivedAt: -1 });

export const Email = model<EmailDocument>('Email', EmailSchema);
