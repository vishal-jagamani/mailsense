import { LOGGER_MODULE } from '@constants';
import { EmailAttachment, OutlookMessageObjectFull, UpdateAPIResponse } from '@mailsense/types';
import { EmailInput } from '@modules/emails/email.model.js';
import { EmailRepository } from '@modules/emails/email.repository.js';
import { ComposeEmailBody } from '@modules/emails/email.schema.js';
import { createLogger } from '@observability';
import { OutlookClient } from '../clients/index.js';
import { OUTLOOK_ATTACHMENT_CHUNK_SIZE, OUTLOOK_ATTACHMENT_MAX_DIRECT_SIZE } from '../outlook.constants.js';
import { OutlookFileAttachmentPayload, SplitAttachmentsResponse } from '../outlook.types.js';
import * as OutlookUtils from '../outlook.utils.js';

const logger = createLogger(LOGGER_MODULE.OUTLOOK_SERVICE);

export class OutlookMailWriteService {
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
    ): SplitAttachmentsResponse {
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

        const email = await OutlookClient.getMessageDetails(accountId, draft.id);
        let attachments: EmailAttachment[] = [];
        if (email.attachments && email.attachments.length > 0) {
            attachments = OutlookUtils.extractOutlookAttachments(email.attachments);
        } else if (email.hasAttachments) {
            const outlookAttachments = await OutlookClient.getMessageAttachments(accountId, email.id);
            attachments = OutlookUtils.extractOutlookAttachments(outlookAttachments);
        }
        const emailData = OutlookUtils.parseEmailDetailsIntoPlainObject(accountId, email, attachments);

        await EmailRepository.upsertEmailsInBulk([emailData]);

        return draft;
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
                await this.trashEmails(accountId, emailIds);
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

    private async trashEmails(accountId: string, emailIds: string[]) {
        try {
            for (const emailId of emailIds) {
                const movedMessage = await OutlookClient.deleteEmail(emailId, accountId);
                const [email] = await EmailRepository.getEmailsByProviderMessageIds([emailId], { folders: 1 });
                const folders = Array.from(new Set([...(email?.folders ?? []), 'TRASH']));

                const updateData: Partial<EmailInput> = { folders };
                if (movedMessage?.id && movedMessage.id !== emailId) {
                    updateData.providerMessageId = movedMessage.id;
                }
                
                await EmailRepository.updateEmailByProviderMessageId(emailId, updateData);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.trashEmails: ${errorMessage}`, { error: err });
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
