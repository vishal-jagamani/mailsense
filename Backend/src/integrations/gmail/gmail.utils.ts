import { GMAIL_SECRETS } from '@config';
import { OAUTH_ACCESS_REDIRECT_URI, OAUTH_SCOPES } from '@constants';
import {
    EmailAttachment,
    FOLDER_KIND,
    FOLDER_ROLE,
    GMAIL_LABEL_LABEL_LIST_VISIBILITY,
    GMAIL_LABEL_TYPE,
    GMAIL_LABELS,
    GmailLabel,
    GmailMessageHeaderFull,
    GmailMessageObjectFull,
    GmailMessagePartsFull,
} from '@mailsense/types';
import { FolderDocument } from '@modules/folders/folder.model.js';
import { htmlToText } from 'html-to-text';

// Build gmail oauth access consent url
export const buildGmailOAuthConsentURL = async () => {
    const params = new URLSearchParams({
        client_id: GMAIL_SECRETS.clientId,
        redirect_uri: GMAIL_SECRETS.redirectUri,
        response_type: 'code',
        access_type: 'offline',
        prompt: 'consent',
        scope: OAUTH_SCOPES.GMAIL,
    });
    return `${OAUTH_ACCESS_REDIRECT_URI?.GMAIL}?${params?.toString()}`;
};

export const parseEmailBody = (data: GmailMessageObjectFull) => {
    let plain = '';
    let html = '';

    const traverse = (part?: GmailMessagePartsFull) => {
        if (!part) return;

        const headers = (part.headers || []).reduce((acc: Record<string, string>, h: GmailMessageHeaderFull) => {
            acc[h.name.toLowerCase()] = h.value;
            return acc;
        }, {});
        const contentDisposition = (headers['content-disposition'] || '').toLowerCase();
        const isAttachment =
            contentDisposition.includes('attachment') || Boolean(part.filename && part.filename.length > 0 && part.body?.attachmentId);

        if (!isAttachment) {
            if (part.mimeType === 'text/plain' && part.body?.data) {
                plain += decodeBase64Url(part.body.data);
            } else if (part.mimeType === 'text/html' && part.body?.data) {
                html += decodeBase64Url(part.body.data);
            }
        }

        if (part.parts && Array.isArray(part.parts)) {
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

export const extractGmailAttachments = (payload?: GmailMessagePartsFull): EmailAttachment[] => {
    const attachments: EmailAttachment[] = [];

    const processPart = (part?: GmailMessagePartsFull) => {
        if (!part) return;

        const headers = (part.headers || []).reduce((acc: Record<string, string>, h: GmailMessageHeaderFull) => {
            acc[h.name.toLowerCase()] = h.value;
            return acc;
        }, {});

        const contentDisposition = (headers['content-disposition'] || '').toLowerCase();
        const contentIdHeader = headers['content-id'] || '';
        const contentId = contentIdHeader.replace(/^<|>$/g, '');
        const filename = getPartFilename(part, headers);
        const hasAttachmentId = Boolean(part.body?.attachmentId);
        const isMultipart = part.mimeType?.startsWith('multipart/');

        const isAttachment =
            !isMultipart &&
            (hasAttachmentId ||
                (filename.length > 0 && part.mimeType !== 'text/plain' && part.mimeType !== 'text/html') ||
                contentDisposition.includes('attachment') ||
                (contentDisposition.includes('inline') && Boolean(contentId || filename)));

        if (isAttachment && (hasAttachmentId || part.body?.data)) {
            const isInline = contentDisposition.includes('inline') || Boolean(contentId);
            const attachmentId = part.body?.attachmentId || part.partId || '';
            const finalFilename = filename || (isInline ? 'inline_image' : 'attachment');

            attachments.push({
                attachmentId,
                filename: finalFilename,
                mimeType: part.mimeType || 'application/octet-stream',
                size: part.body?.size || 0,
                contentId: contentId || undefined,
                isInline,
            });
        }

        if (part.parts && Array.isArray(part.parts)) {
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

const decodeBase64Url = (data: string): string => {
    return Buffer.from(data, 'base64url').toString('utf-8');
};

const getGmailLabelRole = (labelId: string, labelName: string): FOLDER_ROLE => {
    const labelIdUpper = labelId.toUpperCase();
    const labelNameUpper = labelName.toUpperCase();

    if (labelIdUpper === GMAIL_LABELS.INBOX) return FOLDER_ROLE.INBOX;
    if (labelIdUpper === 'SENT') return FOLDER_ROLE.SENT; // Gmail uses 'SENT' as label ID
    if (labelIdUpper === 'DRAFT') return FOLDER_ROLE.DRAFTS;
    if (labelIdUpper === GMAIL_LABELS.TRASH) return FOLDER_ROLE.TRASH;
    if (labelIdUpper === GMAIL_LABELS.SPAM) return FOLDER_ROLE.SPAM;
    if (labelIdUpper === GMAIL_LABELS.STARRED) return FOLDER_ROLE.STARRED;
    if (labelIdUpper === GMAIL_LABELS.IMPORTANT) return FOLDER_ROLE.IMPORTANT;
    if (labelNameUpper.includes('ARCHIVE') || labelNameUpper.includes('ALL MAIL')) return FOLDER_ROLE.ARCHIVE;

    return FOLDER_ROLE.OTHER;
};

export const parseGmailLabelObject = (accountId: string, userId: string, gmailLabel: GmailLabel): Partial<FolderDocument> => {
    return {
        accountId,
        name: gmailLabel.name,
        providerFolderId: gmailLabel.id,
        userId,
        parentProviderFolderId: '',
        normalizedName: gmailLabel.name.toLowerCase().trim(),
        role: getGmailLabelRole(gmailLabel.id, gmailLabel.name),
        kind: gmailLabel.type === GMAIL_LABEL_TYPE.SYSTEM ? FOLDER_KIND.SYSTEM : FOLDER_KIND.CUSTOM,
        totalEmails: gmailLabel.messagesTotal || 0,
        totalUnreadEmails: gmailLabel.messagesUnread || 0,
        totalThreads: gmailLabel.threadsTotal || 0,
        totalUnreadThreads: gmailLabel.threadsUnread || 0,
        totalChildFolders: 0,
        isHidden: gmailLabel.labelListVisibility === GMAIL_LABEL_LABEL_LIST_VISIBILITY.LABEL_HIDE,
        color: {
            text: gmailLabel.color?.textColor || '',
            background: gmailLabel.color?.backgroundColor || '',
        },
        lastSyncedAt: new Date(),
        providerMeta: {
            messageListVisibility: gmailLabel.messageListVisibility,
            labelListVisibility: gmailLabel.labelListVisibility,
            type: gmailLabel.type,
        },
    };
};

export const buildGmailRawString = (to: string[], subject: string, body: string): string => {
    const recipientList = to.join(', ');
    // Standard RFC 2822 format: Headers, followed by a blank line, followed by the body
    const emailParts = [`To: ${recipientList}`, `Subject: ${subject}`, 'Content-Type: text/html; charset="UTF-8"', 'MIME-Version: 1.0', '', body];
    const raw = Buffer.from(emailParts.join('\r\n'))
        .toString('base64')
        .replace(/\+/g, '-') // Replace + with -
        .replace(/\//g, '_') // Replace / with _
        .replace(/=+$/, ''); // Remove padding =
    return raw;
};

export const constructGmailMimeMessage = (
    to: string[],
    subject: string,
    body: string,
    attachments: { filename: string; mimeType: string; buffer: Buffer }[],
): string => {
    const boundary = `====_MailSense_Boundary_${Date.now()}====`;
    const messageParts: string[] = [];

    messageParts.push(`To: ${to.join(', ')}`);
    messageParts.push(`Subject: ${subject}`);
    messageParts.push(`MIME-Version: 1.0`);
    messageParts.push(`Content-Type: multipart/mixed; boundary="${boundary}"\r\n`);

    // Body Subpart
    messageParts.push(`--${boundary}`);
    messageParts.push(`Content-Type: text/html; charset="UTF-8"`);
    messageParts.push(`Content-Transfer-Encoding: 7bit\r\n`);
    messageParts.push(body);

    // Attachment Subparts
    for (const att of attachments) {
        messageParts.push(`--${boundary}`);
        messageParts.push(`Content-Type: ${att.mimeType}; name="${att.filename}"`);
        messageParts.push(`Content-Disposition: attachment; filename="${att.filename}"`);
        messageParts.push(`Content-Transfer-Encoding: base64\r\n`);
        messageParts.push(att.buffer.toString('base64'));
    }

    messageParts.push(`--${boundary}--`);
    const rawMime = messageParts.join('\r\n');
    return Buffer.from(rawMime)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};
