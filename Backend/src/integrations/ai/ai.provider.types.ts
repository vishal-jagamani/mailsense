import { AiTokenUsage } from '@mailsense/types';

export interface GeminiProviderConfig {
    apiKey?: string;
    modelName?: string;
    timeoutMs?: number;
}

export interface SanitizedEmailContent {
    subject: string;
    from: string;
    to: string[];
    sanitizedBody: string;
    receivedAt: Date;
}

export interface GeminiErrorHeaders {
    'retry-after'?: string;
}

export interface GeminiRawApiError {
    status?: number;
    statusCode?: number;
    message?: string;
    headers?: GeminiErrorHeaders;
}

export interface GeminiStructuredGenerationResult<T> {
    data: T;
    tokenUsage?: AiTokenUsage;
    modelName: string;
}
