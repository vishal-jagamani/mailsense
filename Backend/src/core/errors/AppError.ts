import { AppErrorConstructorParams, ErrorContext, ErrorResponsePayload } from '@types';
import { getTraceId } from '../observability/trace.js';
import { ErrorCode } from './ErrorCodes.js';

export class AppError extends Error {
    public readonly httpStatus: number;
    public readonly errorCode: ErrorCode;
    public readonly isOperational: boolean;
    public readonly description: string;
    public readonly suggestedAction: string;
    public readonly traceId: string;
    public readonly context?: ErrorContext;

    constructor(params: AppErrorConstructorParams) {
        super(params.message);

        Object.setPrototypeOf(this, new.target.prototype);

        this.httpStatus = params.httpStatus ?? 500;
        this.errorCode = params.errorCode ?? ErrorCode.INTERNAL_ERROR;
        this.isOperational = params.isOperational ?? true;
        this.description = params.description ?? 'An unexpected error occurred while processing your request.';
        this.suggestedAction = params.suggestedAction ?? 'Please try again later or contact support if the issue persists.';

        // Automatically populate traceId from AsyncLocalStorage if not explicitly passed
        const activeTraceId = getTraceId();
        this.traceId = params.traceId && params.traceId.length > 0 ? params.traceId : activeTraceId;

        this.context = params.context;

        Error.captureStackTrace(this, this.constructor);
    }

    public toJSON(isDevelopment = false): ErrorResponsePayload {
        return {
            status: false,
            message: this.message,
            error: {
                code: this.httpStatus,
                errorCode: this.errorCode,
                traceId: this.traceId,
                description: this.description,
                suggestedAction: this.suggestedAction,
                ...(this.context?.details ? { details: this.context.details } : {}),
                ...(isDevelopment && this.stack ? { stack: this.stack } : {}),
            },
        };
    }
}
