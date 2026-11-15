import { EmailAttachment, GmailMessagePartsFull } from '@mailsense/types';
import { mapHeadersToLowerCase } from './gmail-mime.utils.js';

const getPartFilename = (part: GmailMessagePartsFull, headers: Record<string, string>): string => {
    if (part.filename && part.filename.trim().length > 0) {
        return part.filename.trim();
    }
    const cd = headers['content-disposition'] || '';
    const cdMatch = cd.match(/filename\*?=(?:UTF-8''|")?([^";\r\n]+)"?/i);
    if (cdMatch && cdMatch[1]) {
        try {
            return decodeURIComponent(cdMatch[1].trim().replace(/^"|"$/g, ''));
        } catch {
            return cdMatch[1].trim().replace(/^"|"$/g, '');
        }
    }
    const ct = headers['content-type'] || '';
    const ctMatch = ct.match(/name="?([^";\r\n]+)"?/i);
    if (ctMatch && ctMatch[1]) {
        return ctMatch[1].trim().replace(/^"|"$/g, '');
    }
    return '';
};

const isAttachmentPart = (
    part: GmailMessagePartsFull,
    filename: string,
    contentDisposition: string,
    contentId: string,
    hasAttachmentId: boolean,
): boolean => {
    if (part.mimeType?.startsWith('multipart/')) {
        return false;
    }
    if (hasAttachmentId || contentDisposition.includes('attachment')) {
        return true;
    }
    if (contentDisposition.includes('inline') && (contentId.length > 0 || filename.length > 0)) {
        return true;
    }
    const isText = part.mimeType === 'text/plain' || part.mimeType === 'text/html';
    return filename.length > 0 && !isText;
};

const extractHeaderValue = (headers: Record<string, string>, name: string): string => headers[name] ?? '';

const resolveAttachmentId = (part: GmailMessagePartsFull): string => {
    return part.body?.attachmentId ?? part.partId ?? '';
};

const partHasData = (part: GmailMessagePartsFull, hasAttachmentId: boolean): boolean => {
    return hasAttachmentId || Boolean(part.body?.data);
};

const buildEmailAttachment = (part: GmailMessagePartsFull, filename: string, contentDisposition: string, contentId: string): EmailAttachment => {
    const isInline = contentDisposition.includes('inline') || contentId.length > 0;
    const attachmentId = resolveAttachmentId(part);
    const fallbackName = isInline ? 'inline_image' : 'attachment';

    return {
        attachmentId,
        filename: filename || fallbackName,
        mimeType: part.mimeType || 'application/octet-stream',
        size: part.body?.size || 0,
        contentId: contentId || undefined,
        isInline,
    };
};

export const extractGmailAttachments = (payload?: GmailMessagePartsFull): EmailAttachment[] => {
    const attachments: EmailAttachment[] = [];

    const processPart = (part?: GmailMessagePartsFull): void => {
        if (!part) return;

        const headers = mapHeadersToLowerCase(part.headers);
        const contentDisposition = extractHeaderValue(headers, 'content-disposition').toLowerCase();
        const contentId = extractHeaderValue(headers, 'content-id').replace(/^<|>$/g, '');
        const filename = getPartFilename(part, headers);
        const hasAttachmentId = Boolean(part.body?.attachmentId);

        if (isAttachmentPart(part, filename, contentDisposition, contentId, hasAttachmentId) && partHasData(part, hasAttachmentId)) {
            attachments.push(buildEmailAttachment(part, filename, contentDisposition, contentId));
        }

        if (Array.isArray(part.parts)) {
            for (const subPart of part.parts) {
                processPart(subPart);
            }
        }
    };

    if (payload) {
        processPart(payload);
    }

    return attachments;
};
