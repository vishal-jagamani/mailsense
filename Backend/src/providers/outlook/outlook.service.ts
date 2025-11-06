import { EmailInput } from '@modules/emails/email.model.js';
import { logger } from '@utils/logger.js';
import { OutlookOAuthAccessTokenResponse } from 'types/account.types.js';
import { OutlookApi } from './outlook.api.js';
import { OutlookMessagesResponse, OutlookUserProfile } from './outlook.types.js';
import { compressString } from '@utils/compression.js';

export class OutlookService {
    private outlookApi: OutlookApi;
    constructor() {
        this.outlookApi = new OutlookApi();
    }
    async getAccessTokenFromCode(code: string): Promise<OutlookOAuthAccessTokenResponse> {
        try {
            const response = await this.outlookApi.getAccessTokenFromCode(code);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.getAccessTokenFromCode: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async getUserProfileFromAccessToken(accessToken: string): Promise<OutlookUserProfile> {
        try {
            const response = await this.outlookApi.getUserProfileFromAccessToken(accessToken);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.getUserProfileFromAccessToken: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async getMessages(accountId: string): Promise<EmailInput[]> {
        try {
            const response = await OutlookApi.getMessages(accountId);
            const parsedEmails = await this.parseEmailsIntoPlainObjects(accountId, response);
            return parsedEmails;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.getMessages: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async parseEmailsIntoPlainObjects(accountId: string, emailResponseData: OutlookMessagesResponse): Promise<EmailInput[]> {
        try {
            const parsedEmails: EmailInput[] = emailResponseData.value.map((email) => {
                const emailObject: EmailInput = {
                    accountId,
                    providerMessageId: email.id,
                    threadId: email.conversationId,
                    from: email.from.emailAddress.address,
                    to: email.toRecipients.map((val) => val.emailAddress.address).join(' '),
                    cc: email.ccRecipients.map((val) => val.emailAddress.address).join(' '),
                    bcc: email.bccRecipients.map((val) => val.emailAddress.address).join(' '),
                    subject: email.subject,
                    body: email.body.content,
                    bodyPlain: compressString(email.body.content),
                    bodyHtml: compressString(email.body.content),
                    receivedAt: new Date(email.receivedDateTime),
                    isRead: email.isRead,
                    folder: email.parentFolderId,
                };
                return emailObject;
            });
            return parsedEmails;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.parseEmailsIntoPlainObjects: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
