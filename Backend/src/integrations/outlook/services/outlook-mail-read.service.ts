import { LOGGER_MODULE } from '@constants';
import { AttachmentStreamResult } from '@integrations/email/index.js';
import { EmailAttachment, EmailAttributes, OutlookMessageObjectFull, SearchOtherContactsResponse } from '@mailsense/types';
import { EmailDocument, EmailInput } from '@modules/emails/database/index.js';
import { createLogger } from '@observability';
import { decompressString } from '@utils';
import { OutlookClient } from '../clients/index.js';
import { OUTLOOK_API_BASE_URL, OUTLOOK_API_PARAMS, OUTLOOK_APIs } from '../outlook.constants.js';
import { GetOutlookMessagesResponse, OutlookAttachmentBufferResult, OutlookDeltaMessagesResponse } from '../outlook.types.js';
import * as OutlookUtils from '../outlook.utils.js';

const logger = createLogger(LOGGER_MODULE.OUTLOOK_SERVICE);

export class OutlookMailReadService {
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

    async getMessageDetails(accountId: string, emailId: string, dbEmail?: EmailDocument): Promise<EmailAttributes | EmailInput> {
        try {
            if (dbEmail) {
                let attachments = dbEmail.attachments || [];
                if (attachments.length === 0) {
                    const outlookAttachments = await OutlookClient.getMessageAttachments(accountId, emailId);
                    attachments = OutlookUtils.extractOutlookAttachments(outlookAttachments);
                }
                return {
                    ...dbEmail.toObject(),
                    _id: String(dbEmail._id),
                    bodyHtml: decompressString(dbEmail.bodyHtml),
                    bodyPlain: decompressString(dbEmail.bodyPlain),
                    attachments,
                };
            }
            const email = await OutlookClient.getMessageDetails(accountId, emailId);
            let attachments: EmailAttachment[] = [];
            if (email.attachments && email.attachments.length > 0) {
                attachments = OutlookUtils.extractOutlookAttachments(email.attachments);
            } else if (email.hasAttachments) {
                const outlookAttachments = await OutlookClient.getMessageAttachments(accountId, email.id);
                attachments = OutlookUtils.extractOutlookAttachments(outlookAttachments);
            }
            const parsedEmail = OutlookUtils.parseEmailDetailsIntoPlainObject(accountId, email, attachments);
            return parsedEmail;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.getMessageDetails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async parseEmailsIntoPlainObjects(accountId: string, emailResponseData: OutlookMessageObjectFull[]): Promise<Partial<EmailInput>[]> {
        try {
            const parsedEmails: Partial<EmailInput>[] = await Promise.all(
                emailResponseData.map(async (email) => {
                    let attachments: EmailAttachment[] = [];
                    if (email.hasAttachments) {
                        const outlookAttachments = await OutlookClient.getMessageAttachments(accountId, email.id);
                        attachments = OutlookUtils.extractOutlookAttachments(outlookAttachments);
                    }
                    const emailObject: Partial<EmailInput> = {
                        accountId,
                        providerMessageId: email.id,
                        threadId: email.conversationId,
                        from: email.from.emailAddress.address,
                        to: email.toRecipients.map((val) => val.emailAddress.address),
                        cc: email.ccRecipients.map((val) => val.emailAddress.address),
                        bcc: email.bccRecipients?.map((val) => val.emailAddress.address) || [],
                        subject: email.subject,
                        body: email.bodyPreview || '',
                        receivedAt: new Date(email.receivedDateTime),
                        isRead: email.isRead,
                        attachments,
                    };
                    return emailObject;
                }),
            );
            return parsedEmails;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.parseEmailsIntoPlainObjects: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    private async loopAndGetOutlookDeltaMessages(accountId: string): Promise<OutlookDeltaMessagesResponse> {
        try {
            let url: string | null = `${OUTLOOK_API_BASE_URL}${OUTLOOK_APIs.MESSAGES_DELTA}?$select=${OUTLOOK_API_PARAMS.DELTA_MESSAGES_FIELD}`;
            const emails: OutlookMessageObjectFull[] = [];
            let deltaLink: string = '';
            while (url) {
                const response = await OutlookClient.getMessages(accountId, url);
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

    async searchContacts(accountId: string, searchText: string): Promise<SearchOtherContactsResponse[]> {
        try {
            const response = await OutlookClient.searchContacts(accountId, searchText);
            const contacts = response.value
                .filter((contact) => contact.scoredEmailAddresses && contact.scoredEmailAddresses.length > 0)
                .map((contact) => ({
                    email: contact.scoredEmailAddresses[0].address,
                    name: contact.displayName,
                }));
            return contacts;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.searchContacts: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async getAttachment(accountId: string, messageId: string, attachmentId: string): Promise<OutlookAttachmentBufferResult> {
        const buffer = await OutlookClient.getAttachment(accountId, messageId, attachmentId);
        return {
            data: Buffer.from(buffer),
            mimeType: 'application/octet-stream',
            filename: 'attachment',
        };
    }

    public async getAttachmentStream(accountId: string, messageId: string, attachmentId: string): Promise<AttachmentStreamResult> {
        try {
            return await OutlookClient.getAttachmentStream(accountId, messageId, attachmentId);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.getAttachmentStream: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
