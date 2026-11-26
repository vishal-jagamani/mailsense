import { ErrorLogInput } from '../types/index.js';
import { ErrorLog, ErrorLogDocument } from './error-log.model.js';

export class ErrorLogRepository {
    public static async upsertErrorLog(data: ErrorLogInput): Promise<ErrorLogDocument> {
        return ErrorLog.findOneAndUpdate(
            { fingerprint: data.fingerprint },
            {
                $set: {
                    traceId: data.traceId,
                    source: data.source,
                    severity: data.severity,
                    module: data.module,
                    errorCode: data.errorCode,
                    httpStatus: data.httpStatus,
                    message: data.message,
                    stack: data.stack,
                    context: data.context,
                    environment: data.environment,
                    appVersion: data.appVersion,
                    lastOccurredAt: data.lastOccurredAt,
                    resolved: false,
                },
                $inc: { occurrenceCount: 1 },
            },
            { upsert: true, new: true },
        );
    }

    public static async countUnresolved(): Promise<number> {
        return ErrorLog.countDocuments({ resolved: false });
    }
}
