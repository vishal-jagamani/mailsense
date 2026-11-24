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
