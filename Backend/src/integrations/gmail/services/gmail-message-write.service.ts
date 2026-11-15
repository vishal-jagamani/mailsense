import { LOGGER_MODULE } from '@constants';
import { GMAIL_LABELS, GmailMessageObjectFull, UpdateAPIResponse } from '@mailsense/types';
import { AccountRepository } from '@modules/accounts/database/index.js';
import { EmailRepository } from '@modules/emails/database/index.js';
import { ComposeEmailBody } from '@modules/emails/schema/index.js';
import { createLogger } from '@observability';
import { compressString } from '@utils';
import { GmailClient } from '../clients/index.js';
import * as GmailUtils from '../utils/index.js';
import { GmailMessageIdParam } from '../gmail.types.js';

const logger = createLogger(LOGGER_MODULE.GMAIL_SERVICE);

export class GmailMessageWriteService {
    async deleteEmails(emailIds: string[], accountId: string, trash?: boolean) {
        try {
            if (trash) {
                for (const emailId of emailIds) {
                    const email = await GmailClient.trashEmail(emailId, accountId);
                    await EmailRepository.updateEmailByProviderMessageId(email.id, {
                        folders: email?.labelIds || [],
                    });
                    await AccountRepository.updateAccount(accountId, { lastSyncCursor: email.historyId });
                }
                return;
            } else {
                const response = await GmailClient.permanentlyDeleteEmails(emailIds, accountId);
                await EmailRepository.deleteManyEmails(emailIds);
                return response;
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailService.deleteEmails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async archiveEmails(emailIds: string[], accountId: string, archive: boolean) {
        try {
            for (const emailId of emailIds) {
                const email = await GmailClient.archiveEmail(emailId, accountId, archive);
                const { plainTextBody, htmlBody } = GmailUtils.parseEmailBody(email);
                await EmailRepository.updateEmail(email.id, {
                    ...email,
                    body: plainTextBody,
                    bodyHtml: compressString(htmlBody || ''),
                    bodyPlain: compressString(plainTextBody),
                });
            }
            return;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailService.archiveEmails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async starEmails(emails: GmailMessageIdParam[], accountId: string, star: boolean) {
        try {
            for (const email of emails) {
                const updatedEmail = await GmailClient.starEmail(email.providerMessageId, accountId, star);
                const { plainTextBody, htmlBody } = GmailUtils.parseEmailBody(updatedEmail);
                await EmailRepository.updateEmail(email.id, {
                    ...email,
                    body: plainTextBody,
                    bodyHtml: compressString(htmlBody || ''),
                    bodyPlain: compressString(plainTextBody),
                });
            }
            return;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailService.starEmails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async unreadEmails(emailIds: string[], accountId: string, unread: boolean) {
        try {
            for (const emailId of emailIds) {
                const email = await GmailClient.unreadEmail(emailId, accountId, unread);
                const isRead = !email.labelIds.includes(GMAIL_LABELS.UNREAD);
                await EmailRepository.updateEmailByProviderMessageId(email.id, {
                    folders: email.labelIds || [],
                    isRead,
                });
            }
            return;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailService.unreadEmails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async sendMessage(composeEmailData: ComposeEmailBody): Promise<Partial<GmailMessageObjectFull>> {
        try {
            const { accountId, to, subject, body, attachments } = composeEmailData;
            const raw =
                attachments && attachments.length > 0
                    ? GmailUtils.constructGmailMimeMessage(to, subject, body, attachments)
                    : GmailUtils.buildGmailRawString(to, subject, body);
            const response = await GmailClient.sendMessage(accountId, { raw });
            const emailDetails = await GmailClient.fetchEmailById(response.id, accountId);
            const emilData = GmailUtils.transformGmailMessageToEmailInput(emailDetails, accountId);
            await EmailRepository.upsertEmailsInBulk([emilData]);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailService.sendMessage: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async moveEmails(emailIds: string[], accountId: string, targetFolderIds: string[], removeFolderIds: string[] = []): Promise<UpdateAPIResponse> {
        try {
            if (!emailIds.length) return { status: true, message: 'No emails to move' };
            await GmailClient.batchModifyLabels(accountId, emailIds, targetFolderIds, removeFolderIds);
            return { status: true, message: 'Emails moved successfully' };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error('Failed to move emails in GmailService', { accountId, emailIds, targetFolderIds, removeFolderIds, error: errorMessage });
            throw error;
        }
    }
}
