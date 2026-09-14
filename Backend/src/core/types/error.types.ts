import { ErrorCode } from '@errors';

export interface ValidationDetail {
    field: string;
    message: string;
    value?: string | number | boolean;
}

export interface ErrorContext {
    resource?: string;
    identifier?: string;
    provider?: string;
    details?: ValidationDetail[];
    metadata?: Record<string, string | number | boolean>;
}

export interface AppErrorConstructorParams {
    message: string;
    httpStatus?: number;
    errorCode?: ErrorCode;
    isOperational?: boolean;
    description?: string;
    suggestedAction?: string;
    traceId?: string;
    context?: ErrorContext;
}

export interface ErrorDetailPayload {
    code: number;
    errorCode: ErrorCode;
    traceId: string;
    description: string;
    suggestedAction: string;
    details?: ValidationDetail[];
    stack?: string;
    external?: Record<string, string | number | boolean>;
}

export interface ErrorResponsePayload {
    status: false;
    message: string;
    error: ErrorDetailPayload;
}

export interface ProviderApiErrorParams {
    provider: string;
    message: string;
    providerStatusCode?: number;
    providerErrorMessage?: string;
    description?: string;
    suggestedAction?: string;
    traceId?: string;
}

export interface SyncErrorParams {
    accountId: string;
    syncJobId?: string;
    provider?: string;
    message: string;
    description?: string;
    traceId?: string;
}

export interface ProviderErrorResponse {
    error?: {
        message?: string;
        code?: number | string;
        status?: string;
    };
    message?: string;
}
