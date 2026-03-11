import { GMAIL_SECRETS } from '@config/config.js';
import { OAUTH_ACCESS_REDIRECT_URI, OAUTH_SCOPES } from '@constants/index.js';
import { GMAIL_LABELS, GmailLabel, GmailLabelLabelListVisibility, GmailLabelType, GmailMessageObjectFull } from './gmail.types.js';
import { htmlToText } from 'html-to-text';
import { FolderKind, FolderRole } from '@modules/folders/folder.types.js';
import { FolderDocument } from '@modules/folders/folder.model.js';

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

const getGmailLabelRole = (labelId: string, labelName: string): FolderRole => {
    const labelIdUpper = labelId.toUpperCase();
    const labelNameUpper = labelName.toUpperCase();

    if (labelIdUpper === GMAIL_LABELS.INBOX) return FolderRole.INBOX;
    if (labelIdUpper === 'SENT') return FolderRole.SENT; // Gmail uses 'SENT' as label ID
    if (labelIdUpper === 'DRAFT') return FolderRole.DRAFTS;
    if (labelIdUpper === GMAIL_LABELS.TRASH) return FolderRole.TRASH;
    if (labelIdUpper === GMAIL_LABELS.SPAM) return FolderRole.SPAM;
    if (labelIdUpper === GMAIL_LABELS.STARRED) return FolderRole.STARRED;
    if (labelIdUpper === GMAIL_LABELS.IMPORTANT) return FolderRole.IMPORTANT;
    if (labelNameUpper.includes('ARCHIVE') || labelNameUpper.includes('ALL MAIL')) return FolderRole.ARCHIVE;

    return FolderRole.OTHER;
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
        kind: gmailLabel.type === GmailLabelType.SYSTEM ? FolderKind.SYSTEM : FolderKind.CUSTOM,
        totalEmails: gmailLabel.messagesTotal || 0,
        totalUnreadEmails: gmailLabel.messagesUnread || 0,
        totalThreads: gmailLabel.threadsTotal || 0,
        totalUnreadThreads: gmailLabel.threadsUnread || 0,
        totalChildFolders: 0,
        isHidden: gmailLabel.labelListVisibility === GmailLabelLabelListVisibility.LABEL_HIDE,
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
