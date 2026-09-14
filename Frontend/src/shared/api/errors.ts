import axios, { AxiosError } from 'axios';
import { ApiErrorResponse, FormattedClientError } from '@shared/types';

/**
 * Normalizes backend error responses conforming to `{ status: false, message, error }`.
 * Pure data transformation without try/catch overhead.
 */
export function extractApiError(error: unknown): FormattedClientError {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        const responseData = axiosError.response?.data;

        if (responseData && responseData.error) {
            return {
                message: responseData.message || axiosError.message,
                errorCode: responseData.error.errorCode || 'UNKNOWN_ERROR',
                traceId: responseData.error.traceId || '',
                description: responseData.error.description || '',
                suggestedAction: responseData.error.suggestedAction || 'Please try again later.',
                httpStatus: responseData.error.code || axiosError.response?.status || 500,
            };
        }

        return {
            message: axiosError.message || 'Network request failed',
            errorCode: 'NETWORK_ERROR',
            traceId: '',
            description: 'Failed to communicate with the server.',
            suggestedAction: 'Please check your internet connection and try again.',
            httpStatus: axiosError.response?.status || 500,
        };
    }

    if (error instanceof Error) {
        return {
            message: error.message,
            errorCode: 'CLIENT_ERROR',
            traceId: '',
            description: 'An unexpected client error occurred.',
            suggestedAction: 'Please refresh the page and try again.',
            httpStatus: 500,
        };
    }

    return {
        message: String(error),
        errorCode: 'UNKNOWN_ERROR',
        traceId: '',
        description: 'An unknown error occurred.',
        suggestedAction: 'Please contact support if this continues.',
        httpStatus: 500,
    };
}
