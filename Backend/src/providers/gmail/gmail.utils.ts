import { GMAIL_SECRETS } from '@config/config.js';
import { OAUTH_ACCESS_REDIRECT_URI, OAUTH_SCOPES } from '@constants/index.js';
import { GmailMessageObjectFull } from './gmail.types.js';
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
