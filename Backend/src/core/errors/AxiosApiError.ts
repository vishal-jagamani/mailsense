import { CaughtError, ParsedErrorDetails, ProviderErrorResponse } from '@types';
import axios, { AxiosError } from 'axios';
import { ProviderApiError } from './DomainErrors.js';

function extractAxiosMessage(error: AxiosError<ProviderErrorResponse>): string {
    const data = error?.response?.data;
    const dataMessage = data?.error?.message ?? data?.message;
    return dataMessage || error.message || 'External HTTP request failed';
}

function extractAxiosMetadata(error: AxiosError<ProviderErrorResponse>, statusCode: number): Record<string, string | number | boolean> | undefined {
    if (!error.response?.data) {
        return undefined;
    }
    const config = error.config;
    return {
        status: statusCode,
        url: config?.url ?? 'unknown',
        method: config?.method ?? 'unknown',
    };
}

function parseAxiosError(error: AxiosError<ProviderErrorResponse>): ParsedErrorDetails {
    const statusCode = error.response?.status ?? 502;
    const message = extractAxiosMessage(error);
    const originalError = extractAxiosMetadata(error, statusCode);
    return { message, statusCode, originalError };
}

function parseGenericError(error: CaughtError): ParsedErrorDetails {
    const message = error instanceof Error ? error.message : String(error);
    return {
        message,
        statusCode: 500,
        originalError: { message },
    };
}

function resolveErrorDetails(error: CaughtError): ParsedErrorDetails {
    if (axios.isAxiosError(error)) {
        return parseAxiosError(error as AxiosError<ProviderErrorResponse>);
    }
    return parseGenericError(error);
}

export class AxiosApiError extends ProviderApiError {
    public readonly originalError?: Record<string, string | number | boolean>;

    constructor(error: CaughtError, providerName = 'ExternalAPI', traceId?: string) {
        const details = resolveErrorDetails(error);

        super({
            provider: providerName,
            message: details.message,
            providerStatusCode: details.statusCode,
            providerErrorMessage: details.message,
            traceId,
        });

        this.originalError = details.originalError;
    }
}
