import { ERROR_LOG_SOURCE, ErrorLogContext } from '@mailsense/types';
import crypto from 'node:crypto';

export const computeFingerprint = (source: ERROR_LOG_SOURCE, module: string, errorCode: string, message: string): string => {
    const normalizedMsg = message
        .replace(/[0-9a-f]{24}/gi, '<id>')
        .replace(/\d+/g, '<num>')
        .slice(0, 200);
    return crypto.createHash('sha256').update(`${source}|${module}|${errorCode}|${normalizedMsg}`).digest('hex');
};

const SENSITIVE_KEY_PATTERN = /(token|password|secret|authorization|cookie|apikey|api_key|bodyplain)/i;

export const sanitizeContext = (context?: ErrorLogContext): ErrorLogContext | undefined => {
    if (!context) return undefined;
    const cleanExtra: Record<string, string | number | boolean> = {};
    if (context.extra) {
        for (const [key, val] of Object.entries(context.extra)) {
            cleanExtra[key] = SENSITIVE_KEY_PATTERN.test(key) ? '[REDACTED]' : val;
        }
    }

    return {
        userId: context.userId,
        accountId: context.accountId,
        jobId: context.jobId,
        queueName: context.queueName,
        method: context.method,
        path: context.path,
        pageUrl: context.pageUrl,
        userAgent: context.userAgent,
        ...(Object.keys(cleanExtra).length > 0 ? { extra: cleanExtra } : {}),
    };
};

export const escapeHtml = (value: string): string => {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
};
