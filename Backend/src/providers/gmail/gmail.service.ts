import { EmailInput } from '@modules/emails/email.model.js';
import { compressString } from '@utils/compression.js';
import { logger } from '@utils/logger.js';
import { GmailOAuthAccessTokenResponse } from 'types/account.types.js';
import { GmailApi } from './gmail.api.js';
import { GmailMessages, GmailUserProfile } from './gmail.types.js';
import * as GmailUtils from './gmail.utils.js';

export class GmailService {
    private gmailApi: GmailApi;
    constructor() {
        this.gmailApi = new GmailApi();
    }

    async getAccessTokenFromCode(code: string): Promise<GmailOAuthAccessTokenResponse> {
        try {
            const response = await this.gmailApi.getAccessTokenFromCode(code);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailService.getAccessTokenFromCode: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async getUserProfileFromAccessToken(accessToken: string): Promise<GmailUserProfile> {
        try {
            const response = await this.gmailApi.getUserProfileFromAccessToken(accessToken);
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
                const { plainTextBody, htmlBody } = GmailUtils.parseEmailBody(emailDetails);
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
}
