import { Document, model, Schema } from 'mongoose';
import { FolderAttributes } from './folder.types.js';

export type FolderInput = Omit<FolderAttributes, 'createdAt' | 'updatedAt'>;

export type FolderDocument = Document & FolderAttributes;

export const FolderSchema = new Schema<FolderDocument>(
    {
        userId: { type: String, required: true },
        accountId: { type: String, required: true },
        providerFolderId: { type: String, required: true },
        parentProviderFolderId: { type: String },
        name: { type: String, required: true },
        normalizedName: { type: String, required: true },
        role: { type: String, required: true },
        kind: { type: String, required: true },
        totalEmails: { type: Number, required: true },
        totalUnreadEmails: { type: Number, required: true },
        totalThreads: { type: Number, required: true },
        totalUnreadThreads: { type: Number, required: true },
        totalChildFolders: { type: Number, required: true },
        isHidden: { type: Boolean, required: true },
        color: { type: Object, required: true },
        lastSyncedAt: { type: Date, required: true },
        providerMeta: { type: Object, required: true },
    },
    { timestamps: true, versionKey: false },
);

export const Folder = model<FolderDocument>('Folder', FolderSchema);

// Indexes
FolderSchema.index({ userId: 1, accountId: 1, providerFolderId: 1 }, { unique: true });
