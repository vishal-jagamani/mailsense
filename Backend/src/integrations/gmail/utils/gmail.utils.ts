import { GMAIL_SECRETS } from '@config';
import { OAUTH_ACCESS_REDIRECT_URI, OAUTH_SCOPES } from '@constants';
import {
    FOLDER_KIND,
    FOLDER_ROLE,
    GMAIL_LABEL_LABEL_LIST_VISIBILITY,
    GMAIL_LABEL_TYPE,
    GMAIL_LABELS,
    GmailLabel,
    GmailMessageObjectFull,
} from '@mailsense/types';
import { EmailInput } from '@modules/emails/database/index.js';
import { FolderDocument } from '@modules/folders/database/index.js';
import { compressString } from '@utils';
import { GmailMimeMessageAttachment } from '../gmail.types.js';
import { extractGmailAttachments } from './gmail-header.utils.js';
import { mapHeadersToLowerCase, parseEmailBody } from './gmail-mime.utils.js';

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

const parseRecipientList = (headerValue?: string): string[] => {
    if (!headerValue) return [];
    return headerValue
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);
};

export const transformGmailMessageToEmailInput = (emailDetails: GmailMessageObjectFull, accountId: string): EmailInput => {
    const headers = mapHeadersToLowerCase(emailDetails.payload?.headers);
    const { plainTextBody, htmlBody } = parseEmailBody(emailDetails);
    const receivedAt = new Date(headers.date || '');
    return {
        accountId,
        providerMessageId: emailDetails.id,
        threadId: emailDetails.threadId,
        from: headers.from || '',
        to: parseRecipientList(headers.to),
        cc: parseRecipientList(headers.cc),
        bcc: parseRecipientList(headers.bcc),
        subject: headers.subject || '',
        body: emailDetails.payload?.body?.data || '',
        bodyHtml: compressString(htmlBody || ''),
        bodyPlain: compressString(plainTextBody),
        receivedAt,
        isRead: !emailDetails.labelIds.includes(GMAIL_LABELS.UNREAD),
        folders: emailDetails.labelIds,
        attachments: extractGmailAttachments(emailDetails.payload),
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

export const constructGmailMimeMessage = (to: string[], subject: string, body: string, attachments: GmailMimeMessageAttachment[]): string => {
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
    return Buffer.from(rawMime).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
