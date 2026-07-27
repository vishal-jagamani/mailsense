import { ACCOUNT_SYNC_JOB_STATUS, ACCOUNT_SYNC_JOB_TRIGGER_TYPE, SyncJobAttributes } from '@mailsense/types';
import { Document, model, Schema } from 'mongoose';

export type SyncJobInput = Omit<SyncJobAttributes, '_id' | 'createdAt' | 'updatedAt'>;
export type SyncJobDocument = Document & SyncJobAttributes;

const SyncJobSchema = new Schema<SyncJobDocument>(
    {
        accountId: { type: String, ref: 'Account', required: true, index: true },
        bullJobId: { type: String, required: true, unique: true, index: true },
        status: { type: String, enum: Object.values(ACCOUNT_SYNC_JOB_STATUS), default: ACCOUNT_SYNC_JOB_STATUS.PENDING, index: true },
        triggerType: { type: String, enum: Object.values(ACCOUNT_SYNC_JOB_TRIGGER_TYPE), required: true },
        startedAt: { type: Number, required: true },
        completedAt: { type: Number, required: false },
        addedEmailsCount: { type: Number, default: 0 },
        deletedEmailsCount: { type: Number, default: 0 },
        errorMessage: { type: String, required: false },
        errorStack: { type: String, required: false },
    },
    { timestamps: true, versionKey: false },
);

export const SyncJob = model<SyncJobDocument>('SyncJob', SyncJobSchema);
