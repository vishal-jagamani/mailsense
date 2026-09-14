import { ProviderApiErrorParams, SyncErrorParams, ValidationDetail } from '@types';
import { AppError } from './AppError.js';
import { ErrorCode } from './ErrorCodes.js';

export class NotFoundError extends AppError {
    constructor(resource: string, identifier: string, traceId?: string) {
        super({
            message: `${resource} with identifier '${identifier}' was not found.`,
            httpStatus: 404,
            errorCode: ErrorCode.RESOURCE_NOT_FOUND,
            isOperational: true,
            description: `The requested ${resource.toLowerCase()} does not exist or has been deleted.`,
            suggestedAction: `Verify that the ${resource.toLowerCase()} identifier is correct.`,
            traceId,
            context: { resource, identifier },
        });
    }
}

export class BadRequestError extends AppError {
    constructor(message: string, description?: string, suggestedAction?: string, traceId?: string) {
        super({
            message,
            httpStatus: 400,
            errorCode: ErrorCode.BAD_REQUEST,
            isOperational: true,
            description: description ?? 'The request payload or parameters are invalid.',
            suggestedAction: suggestedAction ?? 'Check the request format and try again.',
            traceId,
        });
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Authentication required', suggestedAction?: string, traceId?: string) {
        super({
            message,
            httpStatus: 401,
            errorCode: ErrorCode.UNAUTHORIZED,
            isOperational: true,
            description: 'You must be authenticated to access this resource.',
            suggestedAction: suggestedAction ?? 'Please log in and include a valid Bearer token.',
            traceId,
        });
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Access forbidden', suggestedAction?: string, traceId?: string) {
        super({
            message,
            httpStatus: 403,
            errorCode: ErrorCode.FORBIDDEN,
            isOperational: true,
            description: 'You do not have permission to perform this action on the specified resource.',
            suggestedAction: suggestedAction ?? 'Contact the workspace administrator for appropriate permissions.',
            traceId,
        });
    }
}

export class ConflictError extends AppError {
    constructor(message: string, resource?: string, traceId?: string) {
        super({
            message,
            httpStatus: 409,
            errorCode: ErrorCode.CONFLICT,
            isOperational: true,
            description: 'The requested operation conflicts with the current state of the resource.',
            suggestedAction: 'Reload the latest data and resolve any conflicting updates.',
            traceId,
            context: resource ? { resource } : undefined,
        });
    }
}

export class ValidationError extends AppError {
    public readonly details: ValidationDetail[];

    constructor(message: string, details: ValidationDetail[], traceId?: string) {
        super({
            message,
            httpStatus: 422,
            errorCode: ErrorCode.VALIDATION_FAILED,
            isOperational: true,
            description: 'One or more fields in the request failed validation.',
            suggestedAction: 'Correct the invalid input fields according to the error details.',
            traceId,
            context: { details },
        });
        this.details = details;
    }
}

export class ProviderApiError extends AppError {
    public readonly provider: string;
    public readonly providerStatusCode?: number;
    public readonly providerErrorMessage?: string;

    constructor(params: ProviderApiErrorParams) {
        super({
            message: `[${params.provider.toUpperCase()}] ${params.message}`,
            httpStatus: 502,
            errorCode: ErrorCode.PROVIDER_API_ERROR,
            isOperational: true,
            description: params.description ?? `External email provider (${params.provider}) returned an error.`,
            suggestedAction: params.suggestedAction ?? 'Please try again in a few moments.',
            traceId: params.traceId,
            context: {
                provider: params.provider,
                metadata: {
                    ...(params.providerStatusCode ? { providerStatusCode: params.providerStatusCode } : {}),
                    ...(params.providerErrorMessage ? { providerErrorMessage: params.providerErrorMessage } : {}),
                },
            },
        });
        this.provider = params.provider;
        this.providerStatusCode = params.providerStatusCode;
        this.providerErrorMessage = params.providerErrorMessage;
    }
}

export class TokenExpiredError extends AppError {
    public readonly accountId: string;
    public readonly provider: string;

    constructor(accountId: string, provider: string, traceId?: string) {
        super({
            message: `OAuth access token for ${provider} account has expired or was revoked.`,
            httpStatus: 401,
            errorCode: ErrorCode.TOKEN_EXPIRED,
            isOperational: true,
            description: `Authentication with ${provider} failed because credentials have expired.`,
            suggestedAction: 'Please reconnect your email account in Account Settings.',
            traceId,
            context: { resource: 'Account', identifier: accountId, provider },
        });
        this.accountId = accountId;
        this.provider = provider;
    }
}

export class RateLimitError extends AppError {
    public readonly provider: string;
    public readonly retryAfterMs?: number;

    constructor(provider: string, retryAfterMs?: number, traceId?: string) {
        const seconds = retryAfterMs ? Math.ceil(retryAfterMs / 1000) : 60;
        super({
            message: `Rate limit exceeded for ${provider} API.`,
            httpStatus: 429,
            errorCode: ErrorCode.PROVIDER_RATE_LIMITED,
            isOperational: true,
            description: `The maximum allowed API request quota for ${provider} was reached.`,
            suggestedAction: `Please wait ${seconds} seconds before retrying this operation.`,
            traceId,
            context: {
                provider,
                metadata: retryAfterMs ? { retryAfterMs } : undefined,
            },
        });
        this.provider = provider;
        this.retryAfterMs = retryAfterMs;
    }
}

export class SyncError extends AppError {
    public readonly accountId: string;
    public readonly syncJobId?: string;

    constructor(params: SyncErrorParams) {
        super({
            message: `Sync operation failed: ${params.message}`,
            httpStatus: 500,
            errorCode: ErrorCode.SYNC_FAILED,
            isOperational: true,
            description: params.description ?? `An error occurred while syncing account '${params.accountId}'.`,
            suggestedAction: 'Trigger a manual sync from the Accounts settings page or wait for scheduled sync.',
            traceId: params.traceId,
            context: {
                resource: 'AccountSync',
                identifier: params.accountId,
                ...(params.provider ? { provider: params.provider } : {}),
                metadata: params.syncJobId ? { syncJobId: params.syncJobId } : undefined,
            },
        });
        this.accountId = params.accountId;
        this.syncJobId = params.syncJobId;
    }
}

export class ExternalServiceError extends AppError {
    public readonly serviceName: string;

    constructor(serviceName: string, message: string, traceId?: string) {
        super({
            message: `External service '${serviceName}' failed: ${message}`,
            httpStatus: 502,
            errorCode: ErrorCode.EXTERNAL_SERVICE_ERROR,
            isOperational: true,
            description: `Dependency service '${serviceName}' is currently unavailable or returned an error.`,
            suggestedAction: 'Retry the request shortly. If the issue continues, check external service health.',
            traceId,
            context: { resource: serviceName },
        });
        this.serviceName = serviceName;
    }
}
