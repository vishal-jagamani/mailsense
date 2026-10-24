import { LOGGER_MODULE } from '@constants';
import { AttachmentStreamResult } from '@integrations/email/email.provider.types.js';
import { EmailAttachment, EmailAttributes, OutlookMessageObjectFull, SearchOtherContactsResponse, UpdateAPIResponse } from '@mailsense/types';
import { EmailDocument, EmailInput } from '@modules/emails/email.model.js';
import { EmailRepository } from '@modules/emails/email.repository.js';
import { ComposeEmailBody } from '@modules/emails/email.schema.js';
import { createLogger } from '@observability';
import { compressString, decompressString } from '@utils';
import { OutlookClient } from '../clients/index.js';
import {
    OUTLOOK_API_BASE_URL,
    OUTLOOK_API_PARAMS,
    OUTLOOK_APIs,
    OUTLOOK_ATTACHMENT_CHUNK_SIZE,
    OUTLOOK_ATTACHMENT_MAX_DIRECT_SIZE,
} from '../outlook.constants.js';
import { GetOutlookMessagesResponse, OutlookFileAttachmentPayload } from '../outlook.types.js';
import * as OutlookUtils from '../outlook.utils.js';

const logger = createLogger(LOGGER_MODULE.OUTLOOK_SERVICE);

export class OutlookMailService {
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
            const parsedEmail = await this.parseEmailDetailsIntoPlainObject(accountId, email);
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

    private async parseEmailDetailsIntoPlainObject(accountId: string, email: OutlookMessageObjectFull): Promise<EmailInput> {
        try {
            let attachments: EmailAttachment[] = [];
            if (email.attachments && email.attachments.length > 0) {
                attachments = OutlookUtils.extractOutlookAttachments(email.attachments);
            } else if (email.hasAttachments) {
                const outlookAttachments = await OutlookClient.getMessageAttachments(accountId, email.id);
                attachments = OutlookUtils.extractOutlookAttachments(outlookAttachments);
            }

            const emailObject: EmailInput = {
                accountId,
                providerMessageId: email.id,
                threadId: email.conversationId,
                from: email.from.emailAddress.address,
                to: email.toRecipients.map((val) => val.emailAddress.address),
                cc: email.ccRecipients.map((val) => val.emailAddress.address),
                bcc: email.bccRecipients?.map((val) => val.emailAddress.address) || [],
                subject: email.subject,
                body: email.bodyPreview || '',
                bodyPlain: compressString(email.body.content),
                bodyHtml: compressString(email.body.content),
                receivedAt: new Date(email.receivedDateTime),
                isRead: email.isRead,
                folders: [email.parentFolderId],
                attachments,
            };
            return emailObject;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.parseEmailDetailsIntoPlainObject: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    private async loopAndGetOutlookDeltaMessages(accountId: string): Promise<{ emails: OutlookMessageObjectFull[]; deltaLink: string }> {
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

    async sendMail(composeEmailData: ComposeEmailBody): Promise<OutlookMessageObjectFull> {
        try {
            const { accountId, to, subject, body, attachments = [] } = composeEmailData;

            const totalAttachmentSize = attachments.reduce((sum, attachment) => sum + attachment.buffer.length, 0);

            const { smallAttachments, largeAttachments } = this.prepareOutlookAttachments(
                attachments,
                OUTLOOK_ATTACHMENT_MAX_DIRECT_SIZE,
                totalAttachmentSize <= OUTLOOK_ATTACHMENT_MAX_DIRECT_SIZE,
            );
            const messageBody = OutlookUtils.buildOutlookMessagePayload(
                to,
                subject,
                body,
                'HTML',
                smallAttachments.length > 0 ? smallAttachments : undefined,
            );

            const draft = await OutlookClient.createDraftMessage(accountId, messageBody);

            for (const attachment of largeAttachments) {
                const session = await OutlookClient.createUploadSession(accountId, draft.id, attachment.filename, attachment.buffer.length);

                for (let start = 0; start < attachment.buffer.length; start += OUTLOOK_ATTACHMENT_CHUNK_SIZE) {
                    const chunk = attachment.buffer.subarray(start, start + OUTLOOK_ATTACHMENT_CHUNK_SIZE);
                    await OutlookClient.uploadChunk(session.uploadUrl, chunk, start, attachment.buffer.length);
                }
            }

            return await this.finalizeSentOutlookDraft(accountId, draft);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.sendMail: ${errorMessage}`, {
                error: err,
            });
            throw err;
        }
    }

    private prepareOutlookAttachments(
        attachments: ComposeEmailBody['attachments'],
        maxDirectSize: number,
        useDirectStrategy: boolean,
    ): {
        smallAttachments: OutlookFileAttachmentPayload[];
        largeAttachments: NonNullable<ComposeEmailBody['attachments']>;
    } {
        const smallAttachments: OutlookFileAttachmentPayload[] = [];
        const largeAttachments: NonNullable<ComposeEmailBody['attachments']> = [];

        for (const attachment of attachments ?? []) {
            if (useDirectStrategy || attachment.buffer.length <= maxDirectSize) {
                smallAttachments.push({
                    '@odata.type': '#microsoft.graph.fileAttachment',
                    name: attachment.filename,
                    contentType: attachment.mimeType,
                    contentBytes: attachment.buffer.toString('base64'),
                });
            } else {
                largeAttachments.push(attachment);
            }
        }

        return { smallAttachments, largeAttachments };
    }

    private async finalizeSentOutlookDraft(accountId: string, draft: OutlookMessageObjectFull): Promise<OutlookMessageObjectFull> {
        await OutlookClient.sendDraftMessage(accountId, draft.id);

        const emailDetails = await OutlookClient.getMessageDetails(accountId, draft.id);
        const emailData = await this.parseEmailDetailsIntoPlainObject(accountId, emailDetails);

        await EmailRepository.upsertEmailsInBulk([emailData]);

        return draft;
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

    public async getAttachment(
        accountId: string,
        messageId: string,
        attachmentId: string,
    ): Promise<{ data: Buffer; mimeType: string; filename: string }> {
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

    async moveEmails(providerMessageIds: string[], accountId: string, targetFolderIds: string[]): Promise<UpdateAPIResponse> {
        try {
            if (!providerMessageIds.length || !targetFolderIds.length) {
                return { status: true, message: 'No emails or folders specified' };
            }
            const destinationId = targetFolderIds[0];

            for (const messageId of providerMessageIds) {
                await OutlookClient.moveMessage(accountId, messageId, destinationId);
            }
            return { status: true, message: 'Emails moved successfully' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Failed to move emails in OutlookService: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async deleteEmails(emailIds: string[], accountId: string, trash?: boolean): Promise<void> {
        try {
            if (trash) {
                for (const emailId of emailIds) {
                    const movedMessage = await OutlookClient.deleteEmail(emailId, accountId);
                    const email = await EmailRepository.getEmailsByProviderMessageIds([emailId], { folders: 1 });
                    const folders = email?.[0]?.folders || [];

                    // Update providerMessageId if it changed during move
                    const updateData: Partial<EmailInput> = {
                        folders: folders.includes('TRASH') ? folders : [...folders, 'TRASH'],
                    };
                    if (movedMessage?.id && movedMessage.id !== emailId) {
                        updateData.providerMessageId = movedMessage.id;
                    }

                    await EmailRepository.updateEmailByProviderMessageId(emailId, updateData);
                }
            } else {
                for (const emailId of emailIds) {
                    await OutlookClient.deleteEmailPermanently(emailId, accountId);
                }
                await EmailRepository.deleteManyEmails(emailIds);
            }
            return;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.deleteEmails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async archiveEmails(emailIds: string[], accountId: string, archive: boolean): Promise<void> {
        try {
            for (const emailId of emailIds) {
                const movedMessage = archive
                    ? await OutlookClient.archiveEmail(emailId, accountId)
                    : await OutlookClient.unarchiveEmail(emailId, accountId);

                // Update providerMessageId if it changed during move
                if (movedMessage?.id && movedMessage.id !== emailId) {
                    await EmailRepository.updateEmailByProviderMessageId(emailId, {
                        providerMessageId: movedMessage.id,
                    });
                }
            }
            return;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.archiveEmails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async unreadEmails(emailIds: string[], accountId: string, unread: boolean): Promise<void> {
        try {
            for (const emailId of emailIds) {
                await OutlookClient.unreadEmail(emailId, accountId, unread);
                await EmailRepository.updateEmailByProviderMessageId(emailId, {
                    isRead: !unread,
                });
            }
            return;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.unreadEmails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async flagEmails(emailIds: string[], accountId: string, flag: boolean): Promise<void> {
        try {
            for (const emailId of emailIds) {
                await OutlookClient.flagEmail(emailId, accountId, flag);
                const email = await EmailRepository.getEmailsByProviderMessageIds([emailId], { _id: 1, folders: 1 });
                if (email.length > 0) {
                    const folders = email[0].folders ?? [];
                    const newFolders = flag ? [...new Set([...folders, 'Flagged'])] : folders.filter((folder) => folder !== 'Flagged');
                    await EmailRepository.updateEmailByProviderMessageId(emailId, {
                        folders: newFolders,
                    });
                }
            }
            return;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.flagEmails: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
