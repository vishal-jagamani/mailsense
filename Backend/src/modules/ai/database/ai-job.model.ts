import { AI_JOB_STATUS, AI_OPERATION_TYPE, AI_PROVIDER_NAME, AiProcessingJobAttributes, AiTokenUsage } from '@mailsense/types';
import { Document, model, Schema } from 'mongoose';

export type AiJobDocument = Document & AiProcessingJobAttributes;

const AiTokenUsageSchema = new Schema<AiTokenUsage>(
    {
        inputTokens: { type: Number, required: true, default: 0 },
        outputTokens: { type: Number, required: true, default: 0 },
        totalTokens: { type: Number, required: true, default: 0 },
        cachedTokens: { type: Number, required: false },
    },
    { _id: false },
);

const AiJobSchema = new Schema<AiJobDocument>(
    {
        userId: { type: String, ref: 'User', required: true, index: true },
        accountId: { type: String, ref: 'Account', required: true, index: true },
        emailId: { type: String, ref: 'Email', required: true, index: true },
        bullJobId: { type: String, required: false, unique: true, sparse: true },
        operationType: {
            type: String,
            enum: Object.values(AI_OPERATION_TYPE),
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: Object.values(AI_JOB_STATUS),
            default: AI_JOB_STATUS.PENDING,
            index: true,
        },
        provider: {
            type: String,
            enum: Object.values(AI_PROVIDER_NAME),
            required: true,
        },
        modelName: { type: String, required: true },
        startedAt: { type: Number, required: true, index: true },
        completedAt: { type: Number, required: false },
        processingDurationMs: { type: Number, required: false, default: 0 },
        tokenUsage: { type: AiTokenUsageSchema, required: false },
        estimatedCostUsd: { type: Number, required: false },
        skippedReason: { type: String, required: false },
        errorMessage: { type: String, required: false },
        errorCode: { type: String, required: false },
        attemptCount: { type: Number, default: 1 },
        traceId: { type: String, required: false, index: true },
    },
    { timestamps: true, versionKey: false },
);

AiJobSchema.index({ userId: 1, operationType: 1, startedAt: -1 });
AiJobSchema.index({ status: 1, startedAt: -1 });

export const AiJob = model<AiJobDocument>('AiJob', AiJobSchema);
