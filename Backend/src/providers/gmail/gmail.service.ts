import { GMAIL_SECRETS } from '@config/config.js';
import { OAUTH_ACCESS_TOKEN_URI } from '@constants/index.js';
import { EmailInput } from '@modules/emails/email.model.js';
import { apiRequest } from '@utils/axios.js';
import { compressString } from '@utils/compression.js';
import { logger } from '@utils/logger.js';
import { AxiosRequestConfig } from 'axios';
import { htmlToText } from 'html-to-text';
import { GmailOAuthAccessTokenResponse } from 'types/account.types.js';
import { GmailApi } from './gmail.api.js';
import { GMAIL_USER_INFO } from './gmail.constants.js';
import { GmailMessageObjectFull, GmailMessages, GmailUserProfile } from './gmail.types.js';

export class GmailService {
    private gmailApi: GmailApi;
    constructor() {
        this.gmailApi = new GmailApi();
    }
    async getAccessTokenFromCode(code: string): Promise<GmailOAuthAccessTokenResponse> {
        try {
            const options: AxiosRequestConfig = {
                url: OAUTH_ACCESS_TOKEN_URI.GMAIL,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                data: {
                    code,
                    client_id: GMAIL_SECRETS.client_id,
                    client_secret: GMAIL_SECRETS.client_secret,
                    redirect_uri: GMAIL_SECRETS.redirect_uri,
                    grant_type: 'authorization_code',
                },
            };
            const response: GmailOAuthAccessTokenResponse = await apiRequest(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailService.getAccessTokenFromCode: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async getUserProfileFromAccessToken(accessToken: string): Promise<GmailUserProfile> {
        try {
            const options: AxiosRequestConfig = {
                // url: `${GMAIL_API_BASE_URL}${GMAIL_APIs.PROFILE}`,
                url: GMAIL_USER_INFO,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            };
            const response: GmailUserProfile = await apiRequest(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailService.getUserProfileFromAccessToken: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async getMessages(accountId: string, accessToken: string): Promise<EmailInput[]> {
        try {
            const emails = await this.gmailApi.fetchEmails(accessToken);
            const parsedEmails = await this.parseEmailsIntoPlainObjects(accountId, emails, accessToken);
            return parsedEmails;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailService.getMessages: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async parseEmailsIntoPlainObjects(accountId: string, emails: GmailMessages, accessToken: string): Promise<EmailInput[]> {
        try {
            const parsedEmails = emails.messages.map(async (email: { id: string; threadId: string }) => {
                const emailDetails = await this.gmailApi.fetchEmailById(email.id, accessToken);
                const { plainTextBody, htmlBody } = this.parseEmailBody(emailDetails);
                const emailObject: EmailInput = {
                    accountId: accountId,
                    providerMessageId: emailDetails.id,
                    threadId: emailDetails.threadId,
                    from: emailDetails.payload.headers.find((val) => val.name === 'From')?.value || '',
                    to: emailDetails.payload.headers.find((val) => val.name === 'To')?.value || '',
                    cc: emailDetails.payload.headers.find((val) => val.name === 'Cc')?.value || '',
                    bcc: emailDetails.payload.headers.find((val) => val.name === 'Bcc')?.value || '',
                    subject: emailDetails.payload.headers.find((val) => val.name === 'Subject')?.value || '',
                    body: emailDetails.payload.body.data || '',
                    bodyHtml: compressString(htmlBody || ''),
                    bodyPlain: compressString(plainTextBody),
                    receivedAt: new Date(emailDetails.payload.headers.find((val) => val.name === 'Date')?.value || ''),
                    isRead: !emailDetails.labelIds.includes('UNREAD'),
                    folder: emailDetails.labelIds.includes('INBOX') ? 'inbox' : 'sent',
                };
                return emailObject;
            });
            const parsedEmailsArray = await Promise.all(parsedEmails);
            return parsedEmailsArray;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailService.parseEmailsIntoPlainObjects: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    private parseEmailBody(data: GmailMessageObjectFull): { plainTextBody: string; htmlBody?: string } {
        if (data?.payload?.body?.data) {
            return { plainTextBody: this.decodeBase64Url(data?.payload?.body?.data) };
        }
        if (data?.payload?.parts) {
            let plain = '';
            let html = '';
            for (const part of data.payload.parts) {
                if (part?.mimeType === 'text/plain' && part?.body?.data) {
                    plain += this.decodeBase64Url(part?.body?.data);
                }
                if (part?.mimeType === 'text/html' && part?.body?.data) {
                    html += this.decodeBase64Url(part?.body?.data);
                }
            }
            if (!plain && html) {
                plain = htmlToText(html);
            }
            return { plainTextBody: plain, htmlBody: html };
        }
        return { plainTextBody: '' };
    }

    private decodeBase64Url(data: string): string {
        const normalized = data.replace('/-/g', '+').replace('_/', '/');
        return Buffer.from(normalized, 'base64').toString('utf-8');
    }
}
