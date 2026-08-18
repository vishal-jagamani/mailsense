import {
    EmailAttachment,
    EmailAttributes,
    OutlookMessageObjectFull,
    OutlookOAuthAccessTokenResponse,
    OutlookUserProfile,
    SearchOtherContactsResponse,
    UpdateAPIResponse
} from '@mailsense/types';
import { EmailDocument, EmailInput } from '@modules/emails/email.model.js';
import { EmailRepository } from '@modules/emails/email.repository.js';
import { ComposeEmailBody } from '@modules/emails/email.schema.js';
import { FolderDocument, FolderInput } from '@modules/folders/folder.model.js';
import { FolderRepository } from '@modules/folders/folder.repository.js';
import { compressString, decompressString, logger } from 'shared/utils/index.js';
import { OutlookApi } from './outlook.client.js';
import {
    OUTLOOK_API_BASE_URL,
    OUTLOOK_API_PARAMS,
    OUTLOOK_APIs,
    OUTLOOK_ATTACHMENT_CHUNK_SIZE,
    OUTLOOK_ATTACHMENT_MAX_DIRECT_SIZE
} from './outlook.constants.js';
import {
    ExtractDeltaMessageChangesResponse,
    GetOutlookDeltaMessagesResponse,
    GetOutlookMessagesResponse,
    OutlookFileAttachmentPayload,
    OutlookFolderObject,
} from './outlook.types.js';
import * as OutlookUtils from './outlook.utils.js';
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

    async getMessageDetails(accountId: string, emailId: string, dbEmail?: EmailDocument): Promise<EmailAttributes | EmailInput> {
        try {
            if (dbEmail) {
                let attachments = dbEmail.attachments || [];
                if (attachments.length === 0) {
                    const outlookAttachments = await OutlookApi.getMessageAttachments(accountId, emailId);
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

    async parseEmailsIntoPlainObjects(accountId: string, emailResponseData: OutlookMessageObjectFull[]): Promise<Partial<EmailInput>[]> {
        try {
            const parsedEmails: Partial<EmailInput>[] = await Promise.all(
                emailResponseData.map(async (email) => {
                    let attachments: EmailAttachment[] = [];
                    if (email.hasAttachments) {
                        const outlookAttachments = await OutlookApi.getMessageAttachments(accountId, email.id);
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
                const outlookAttachments = await OutlookApi.getMessageAttachments(accountId, email.id);
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

    async deleteEmails(emailIds: string[], accountId: string, trash?: boolean): Promise<void> {
        try {
            if (trash) {
                for (const emailId of emailIds) {
                    const movedMessage = await OutlookApi.deleteEmail(emailId, accountId);
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
                    await OutlookApi.deleteEmailPermanently(emailId, accountId);
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
                    ? await OutlookApi.archiveEmail(emailId, accountId)
                    : await OutlookApi.unarchiveEmail(emailId, accountId);

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
                await OutlookApi.unreadEmail(emailId, accountId, unread);
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
                await OutlookApi.flagEmail(emailId, accountId, flag);
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

    async getAllFolders(accountId: string, userId: string): Promise<Partial<FolderInput>[]> {
        try {
            const folders = await OutlookApi.getAllFolders(accountId);
            const folderInputs: Partial<FolderInput>[] = folders.value.map((folder) =>
                OutlookUtils.parseOutlookFolderObject(accountId, userId, folder),
            );
            return folderInputs;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.getAllFolders: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async getFolderDetails(accountId: string, folderId: string): Promise<OutlookFolderObject> {
        try {
            const folder = await OutlookApi.getFolderDetails(accountId, folderId);
            return folder;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.getFolderDetails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async createFolder(userId: string, accountId: string, folderName: string, isHidden: boolean): Promise<UpdateAPIResponse> {
        try {
            const folder = await OutlookApi.createFolder(accountId, folderName, isHidden);
            const folderBody = OutlookUtils.parseOutlookFolderObject(accountId, userId, folder);
            await FolderRepository.createFolder(folderBody);
            return { status: true, message: 'Folder created successfully' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.createFolder: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async updateFolder(accountId: string, folderId: string, folderName: string): Promise<UpdateAPIResponse> {
        try {
            await OutlookApi.updateFolder(accountId, folderId, folderName);
            const folderBody: Partial<FolderDocument> = {
                name: folderName,
                normalizedName: folderName.toLowerCase().trim(),
            };
            await FolderRepository.updateFolderByProviderFolderId(folderId, folderBody);
            return { status: true, message: 'Folder updated successfully' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.updateFolder: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async deleteFolder(accountId: string, folderId: string): Promise<UpdateAPIResponse> {
        try {
            await OutlookApi.deleteFolder(accountId, folderId);
            await FolderRepository.deleteFolderByProviderFolderId(folderId);
            return { status: true, message: 'Folder deleted successfully' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.deleteFolder: ${errorMessage}`, { error: err });
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

            const draft = await OutlookApi.createDraftMessage(accountId, messageBody);

            for (const attachment of largeAttachments) {
                const session = await OutlookApi.createUploadSession(accountId, draft.id, attachment.filename, attachment.buffer.length);

                for (let start = 0; start < attachment.buffer.length; start += OUTLOOK_ATTACHMENT_CHUNK_SIZE) {
                    const chunk = attachment.buffer.subarray(start, start + OUTLOOK_ATTACHMENT_CHUNK_SIZE);
                    await OutlookApi.uploadChunk(session.uploadUrl, chunk, start, attachment.buffer.length);
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
        await OutlookApi.sendDraftMessage(accountId, draft.id);

        const emailDetails = await OutlookApi.getMessageDetails(accountId, draft.id);
        const emailData = await this.parseEmailDetailsIntoPlainObject(accountId, emailDetails);

        await EmailRepository.upsertEmailsInBulk([emailData]);

        return draft;
    }

    async searchContacts(accountId: string, searchText: string): Promise<SearchOtherContactsResponse[]> {
        try {
            const response = await OutlookApi.searchContacts(accountId, searchText);
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
        const buffer = await OutlookApi.getAttachment(accountId, messageId, attachmentId);
        return {
            data: Buffer.from(buffer),
            mimeType: 'application/octet-stream',
            filename: 'attachment',
        };
    }
}
