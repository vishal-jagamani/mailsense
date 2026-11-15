import { GmailMessageHeaderFull, GmailMessageObjectFull, GmailMessagePartsFull } from '@mailsense/types';
import { htmlToText } from 'html-to-text';

export const decodeBase64Url = (data: string): string => {
    return Buffer.from(data, 'base64url').toString('utf-8');
};

export const decodeBase64Buffer = (data?: string | null): Buffer | null => {
    if (!data) return null;
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(base64, 'base64');
};

const isBodyPartAttachment = (part: GmailMessagePartsFull, contentDisposition: string): boolean => {
    if (contentDisposition.includes('attachment')) return true;
    const hasFilename = Boolean(part.filename && part.filename.length > 0);
    return Boolean(hasFilename && part.body?.attachmentId);
};

export const mapHeadersToLowerCase = (headers?: GmailMessageHeaderFull[]): Record<string, string> => {
    if (!headers) return {};
    const map: Record<string, string> = {};
    for (const h of headers) {
        map[h.name.toLowerCase()] = h.value;
    }
    return map;
};

export const parseEmailBody = (data: GmailMessageObjectFull) => {
    let plain = '';
    let html = '';

    const traverse = (part?: GmailMessagePartsFull) => {
        if (!part) return;

        const headers = mapHeadersToLowerCase(part.headers);
        const contentDisposition = (headers['content-disposition'] || '').toLowerCase();
        const isAttachment = isBodyPartAttachment(part, contentDisposition);

        if (!isAttachment && part.body?.data) {
            if (part.mimeType === 'text/plain') {
                plain += decodeBase64Url(part.body.data);
            } else if (part.mimeType === 'text/html') {
                html += decodeBase64Url(part.body.data);
            }
        }

        if (Array.isArray(part.parts)) {
            for (const subPart of part.parts) {
                traverse(subPart);
            }
        }
    };

    if (data?.payload) {
        if (data.payload.body?.data) {
            if (data.payload.mimeType === 'text/html') {
                html = decodeBase64Url(data.payload.body.data);
                plain = htmlToText(html);
            } else {
                plain = decodeBase64Url(data.payload.body.data);
            }
        } else {
            traverse(data.payload);
        }
    }

    if (!plain && html) {
        plain = htmlToText(html);
    }

    return { plainTextBody: plain, htmlBody: html };
};
