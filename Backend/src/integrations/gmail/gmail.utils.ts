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
    if (data?.payload?.body?.data) {
        return { plainTextBody: decodeBase64Url(data?.payload?.body?.data) };
    }
    if (data?.payload?.parts) {
        let plain = '';
        let html = '';
        for (const part of data.payload.parts) {
            if (part?.mimeType === 'text/plain' && part?.body?.data) {
                plain += decodeBase64Url(part?.body?.data);
            }
            if (part?.mimeType === 'text/html' && part?.body?.data) {
                html += decodeBase64Url(part?.body?.data);
            }
        }
        if (!plain && html) {
            plain = htmlToText(html);
        }
        return { plainTextBody: plain, htmlBody: html };
    }
    return { plainTextBody: '' };
};

const decodeBase64Url = (data: string): string => {
    const normalized = data.replace('/-/g', '+').replace('_/', '/');
    return Buffer.from(normalized, 'base64').toString('utf-8');
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
