import { ERROR_LOG_SEVERITY, ERROR_LOG_SOURCE, ErrorLogAttributes } from '@mailsense/types';
import { Document, model, Schema } from 'mongoose';

export type ErrorLogDocument = Document & ErrorLogAttributes;

const ErrorLogSchema = new Schema<ErrorLogDocument>(
    {
        traceId: { type: String, required: false, index: true },
        fingerprint: { type: String, required: true, unique: true },
        source: { type: String, enum: Object.values(ERROR_LOG_SOURCE), required: true, index: true },
        severity: { type: String, enum: Object.values(ERROR_LOG_SEVERITY), required: true, index: true },
        module: { type: String, required: true, index: true },
        errorCode: { type: String, required: true, index: true },
        httpStatus: { type: Number, required: false },
        message: { type: String, required: true },
        stack: { type: String, required: false },
        context: { type: Schema.Types.Mixed, required: false },
        environment: { type: String, required: true },
        appVersion: { type: String, required: true },
        resolved: { type: Boolean, default: false, index: true },
        occurrenceCount: { type: Number, default: 1 },
        lastOccurredAt: { type: Number, required: true, index: true },
    },
    { timestamps: true, versionKey: false },
);

// Automatic 90-day TTL retention policy (7,776,000 seconds)
ErrorLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

export const ErrorLog = model<ErrorLogDocument>('ErrorLog', ErrorLogSchema);
