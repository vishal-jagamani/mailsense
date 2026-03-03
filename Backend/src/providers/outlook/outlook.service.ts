import { EmailInput } from '@modules/emails/email.model.js';
import { logger } from '@utils/logger.js';
import { OutlookOAuthAccessTokenResponse } from 'types/account.types.js';
import { OutlookApi } from './outlook.api.js';
import { OUTLOOK_API_BASE_URL, OUTLOOK_API_PARAMS, OUTLOOK_APIs } from './outlook.constants.js';
import {
    ExtractDeltaMessageChangesResponse,
    GetOutlookDeltaMessagesResponse,
    GetOutlookMessagesResponse,
    OutlookMessageObjectFull,
    OutlookUserProfile,
} from './outlook.types.js';

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

    async getMessagesAfterLastDelta(accountId: string, deltaLink: string): Promise<GetOutlookDeltaMessagesResponse | null> {
        try {
            if (!deltaLink) return null;
            const response = await this.outlookApi.getMessagesFromDeltaLink(accountId, deltaLink);
            const { addedEmails, deletedEmailIds } = await this.extractDeltaMessagesChanges(response.value);
            let newAddedEmails: Partial<EmailInput>[] = [];
            if (addedEmails.length) {
                newAddedEmails = await this.parseEmailsIntoPlainObjects(accountId, addedEmails);
            }
            return { addedEmails: newAddedEmails, deletedEmailIds, newDeltaLink: response['@odata.deltaLink'] || '' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.getMessagesAfterLastDelta: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    private async extractDeltaMessagesChanges(emails: OutlookMessageObjectFull[]): Promise<ExtractDeltaMessageChangesResponse> {
        try {
            const addedEmails: OutlookMessageObjectFull[] = [];
            const deletedEmailIds: string[] = [];
            for (const email of emails) {
                if ('@removed' in email) {
                    deletedEmailIds.push(email.id);
                } else {
                    addedEmails.push(email);
                }
            }
            return { addedEmails, deletedEmailIds };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.extractMessagesChanges: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async getMessages(accountId: string): Promise<GetOutlookMessagesResponse> {
        try {
            const { emails, deltaLink } = await this.loopAndGetOutlookDeltaMessages(accountId);
            const parsedEmails = await this.parseEmailsIntoPlainObjects(accountId, emails);
            return { emails: parsedEmails, deltaLink };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.getMessages: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async getMessageDetails(accountId: string, emailId: string): Promise<EmailInput> {
        try {
            const email = await OutlookApi.getMessageDetails(accountId, emailId);
            const parsedEmail = await this.parseEmailDetailsIntoPlainObject(accountId, email);
            return parsedEmail;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.getMessageDetails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    private async loopAndGetOutlookDeltaMessages(accountId: string): Promise<{ emails: OutlookMessageObjectFull[]; deltaLink: string }> {
        try {
            let url: string | null = `${OUTLOOK_API_BASE_URL}${OUTLOOK_APIs.MESSAGES_DELTA}?$select=${OUTLOOK_API_PARAMS.DELTA_MESSAGES_FIELD}`;
            const emails: OutlookMessageObjectFull[] = [];
            let deltaLink: string = '';
            while (url) {
                const response = await OutlookApi.getMessages(accountId, url);
                emails.push(...response.value);
                if (response['@odata.deltaLink']) {
                    deltaLink = response['@odata.deltaLink'];
                }
                if (!response['@odata.nextLink']) {
                    url = null;
                } else {
                    url = response['@odata.nextLink'];
                }
            }
            return { emails, deltaLink };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.loopAndGetOutlookDeltaMessages: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async parseEmailsIntoPlainObjects(
        accountId: string,
        emailResponseData: OutlookMessageObjectFull[],
    ): Promise<Partial<EmailInput>[] | EmailInput[]> {
        try {
            const parsedEmails: Partial<EmailInput>[] = emailResponseData.map((email) => {
                const emailObject: Partial<EmailInput> = {
                    accountId,
                    providerMessageId: email.id,
                    threadId: email.conversationId,
                    from: email.from.emailAddress.address,
                    to: email.toRecipients.map((val) => val.emailAddress.address),
                    cc: email.ccRecipients.map((val) => val.emailAddress.address),
                    bcc: email.bccRecipients.map((val) => val.emailAddress.address),
                    subject: email.subject,
                    body: email.bodyPreview || '',
                    receivedAt: new Date(email.receivedDateTime),
                    isRead: email.isRead,
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

    private async parseEmailDetailsIntoPlainObject(accountId: string, email: OutlookMessageObjectFull): Promise<EmailInput> {
        try {
            const emailObject: EmailInput = {
                accountId,
                providerMessageId: email.id,
                threadId: email.conversationId,
                from: email.from.emailAddress.address,
                to: email.toRecipients.map((val) => val.emailAddress.address),
                cc: email.ccRecipients.map((val) => val.emailAddress.address),
                bcc: email.bccRecipients.map((val) => val.emailAddress.address),
                subject: email.subject,
                body: email.bodyPreview || '',
                bodyPlain: email.body.content,
                bodyHtml: email.body.content,
                receivedAt: new Date(email.receivedDateTime),
                isRead: email.isRead,
                folders: [email.parentFolderId],
            };
            return emailObject;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.parseEmailsIntoPlainObjects: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
