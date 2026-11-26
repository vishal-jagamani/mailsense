import { ErrorLogDocument } from '../database/error-log.model.js';
import { escapeHtml } from '../utils/index.js';

export const ALERT_EMAIL_TEXT = (doc: ErrorLogDocument): string => {
    return [
        `MailSense Runtime Error Alert`,
        `Severity: ${doc.severity} | Source: ${doc.source}`,
        `Environment: ${doc.environment} | Version: ${doc.appVersion}`,
        `Module: ${doc.module} | ErrorCode: ${doc.errorCode}`,
        `Trace ID: ${doc.traceId ?? 'N/A'} | Occurrences: ${doc.occurrenceCount}`,
        `Message: ${doc.message}`,
        doc.stack ? `\nStack:\n${doc.stack.slice(0, 1000)}` : '',
    ].join('\n');
};

export const ALERT_EMAIL_HTML = (doc: ErrorLogDocument): string => {
    const safeSeverity = escapeHtml(doc.severity);
    const safeEnvironment = escapeHtml(doc.environment);
    const safeVersion = escapeHtml(doc.appVersion);
    const safeSource = escapeHtml(doc.source);
    const safeModule = escapeHtml(doc.module);
    const safeErrorCode = escapeHtml(doc.errorCode);
    const safeTraceId = escapeHtml(doc.traceId ?? 'N/A');
    const safeMessage = escapeHtml(doc.message);
    const safeStack = doc.stack ? escapeHtml(doc.stack.slice(0, 1200)) : '';

    return `
            <div style="font-family: sans-serif; line-height: 1.5; color: #111827;">
                <h2 style="color: #dc2626;">MailSense Error Alert [${safeSeverity}]</h2>
                <p><strong>Environment:</strong> ${safeEnvironment} (v${safeVersion})</p>
                <p><strong>Source / Module:</strong> ${safeSource} &rarr; ${safeModule}</p>
                <p><strong>Error Code:</strong> ${safeErrorCode} ${doc.httpStatus ? `(HTTP ${doc.httpStatus})` : ''}</p>
                <p><strong>Trace ID:</strong> <code>${safeTraceId}</code> &bull; <strong>Occurrences:</strong> ${doc.occurrenceCount}</p>
                <p><strong>Message:</strong> ${safeMessage}</p>
                ${safeStack ? `<pre style="background: #f3f4f6; padding: 12px; border-radius: 6px; overflow-x: auto;">${safeStack}</pre>` : ''}
            </div>
        `;
};
