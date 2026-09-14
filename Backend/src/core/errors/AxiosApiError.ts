import { ProviderErrorResponse } from '@types';
import axios, { AxiosError } from 'axios';
import { ProviderApiError } from './DomainErrors.js';

export class AxiosApiError extends ProviderApiError {
    public readonly originalError?: Record<string, string | number | boolean>;

    constructor(error: unknown, providerName = 'ExternalAPI', traceId?: string) {
        if (axios.isAxiosError(error)) {
            const typedAxiosError = error as AxiosError<ProviderErrorResponse>;
            const statusCode = typedAxiosError.response?.status ?? 502;
            const responseData = typedAxiosError.response?.data;

            const extractedMessage =
                responseData?.error?.message ?? responseData?.message ?? typedAxiosError.message ?? 'External HTTP request failed';

            super({
                provider: providerName,
                message: extractedMessage,
                providerStatusCode: statusCode,
                providerErrorMessage: extractedMessage,
                traceId,
            });

            if (responseData && typeof responseData === 'object') {
                this.originalError = {
                    status: statusCode,
                    url: typedAxiosError.config?.url ?? 'unknown',
                    method: typedAxiosError.config?.method ?? 'unknown',
                };
            }
        } else {
            const standardError = error instanceof Error ? error : new Error(String(error));
            super({
                provider: providerName,
                message: standardError.message,
                providerStatusCode: 500,
                providerErrorMessage: standardError.message,
                traceId,
            });
            this.originalError = {
                message: standardError.message,
            };
        }
    }
}
