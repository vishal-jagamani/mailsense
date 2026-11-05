import { LOGGER_MODULE } from '@constants';
import { NotFoundError } from '@errors';
import {
    GMAIL_LABELS,
    GmailHistoryResponse,
    GmailMessageObjectFull,
    GmailMessages,
    SearchOtherContactsResponse,
    UpdateAPIResponse,
} from '@mailsense/types';
import { ACCOUNT_FETCH_ACCESS_TOKEN_DB_FIELD_MAPPING } from '@modules/accounts/account.constants.js';
import { AccountRepository } from '@modules/accounts/account.repository.js';
import { EmailInput } from '@modules/emails/database/email.model.js';
import { EmailRepository } from '@modules/emails/database/email.repository.js';
import { ComposeEmailBody } from '@modules/emails/email.schema.js';
import { createLogger } from '@observability';
import { BatchProcessor, compressString } from '@utils';
import axios from 'axios';
import { GmailClient } from '../clients/index.js';
import {
    ExtractMessageChangesResponse,
    GetGmailMessagesResponse,
    GmailMessage,
    GmailMessageIdParam,
    GmailParsedEmailResult,
    MessagesAfterLastHistoryResponse,
} from '../gmail.types.js';
import * as GmailUtils from '../gmail.utils.js';

const logger = createLogger(LOGGER_MODULE.GMAIL_SERVICE);

export class GmailMessageService {
    async getMessages(accountId: string): Promise<GetGmailMessagesResponse> {
        try {
            const account = await AccountRepository.getAccountById(
                accountId,
                ACCOUNT_FETCH_ACCESS_TOKEN_DB_FIELD_MAPPING.FETCH_ACCESS_TOKEN.projection,
            );
            if (!account) {
                throw new NotFoundError('Account', accountId);
            }
            const emails = await GmailClient.fetchEmails(accountId, 500);
            const parsedEmails = await this.parseEmailsIntoPlainObjects(accountId, emails);
            return { emails: parsedEmails.emails, lastSyncCursor: parsedEmails.lastSyncCursor };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailService.getMessages: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async getMessagesByMessagesId(accountId: string, messagesIds: string[]): Promise<EmailInput[]> {
        try {
            const emails: EmailInput[] = [];
            for (const messageId of messagesIds) {
                const emailDetails = await GmailClient.fetchEmailById(messageId, accountId);
                const emailObject = GmailUtils.transformGmailMessageToEmailInput(emailDetails, accountId);
                emails.push(emailObject);
            }
            return emails;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailService.getMessagesByMessagesId: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async getMessagesAfterLastHistory(accountId: string, historyId: string): Promise<MessagesAfterLastHistoryResponse | null> {
        try {
            if (!historyId) return null;
            const historyDetails = await GmailClient.getHistory(accountId, historyId);
            if (!historyDetails) return null;

            const { addedMessageIds, deletedMessageIds } = this.extractMessageChanges(historyDetails);
            const addedMessages = await this.getMessagesByMessagesId(accountId, addedMessageIds);

            return { addedMessages, deletedMessages: deletedMessageIds, newHistoryId: historyDetails.historyId };
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 404) {
                return null;
            }
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailService.getMessagesAfterLastHistory: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    private extractMessageChanges(history: GmailHistoryResponse): ExtractMessageChangesResponse {
        if (!history || !history.history || !Array.isArray(history.history) || history.history.length === 0) {
            return { addedMessageIds: [], deletedMessageIds: [] };
        }
        const addedMessages = history.history
            .flatMap((item) => item.messagesAdded ?? [])
            .map((item) => item.message.id)
            .filter(Boolean);
        const deletedMessages = history.history
            .flatMap((item) => item.messagesDeleted ?? [])
            .map((item) => item?.message?.id ?? item?.messageId ?? item?.id)
            .filter(Boolean);
        const genericMessages = history.history
            .flatMap((item) => item.messages ?? [])
            .map((item) => item?.id)
            .filter(Boolean);
        const allAdded = [...new Set([...addedMessages, ...genericMessages])];
        const addedMessageIds = allAdded.filter((id) => !deletedMessages.includes(id))?.map((id) => id);
        const deletedMessageIds = [...new Set(deletedMessages)] as string[];
        return { addedMessageIds, deletedMessageIds };
    }

    async parseEmailsIntoPlainObjects(accountId: string, emails: GmailMessages): Promise<GetGmailMessagesResponse> {
        try {
            const batchProcessor = new BatchProcessor<GmailMessage, GmailParsedEmailResult | null>(5, 100);

            const parsedEmails = await batchProcessor.processBatches(emails.messages, async (email: GmailMessage) => {
                try {
                    const emailDetails = await GmailClient.fetchEmailById(email.id, accountId);
                    const emailObject = GmailUtils.transformGmailMessageToEmailInput(emailDetails, accountId);
                    return {
                        emailObject,
                        historyId: emailDetails.historyId,
                        receivedAt: emailObject.receivedAt,
                    };
                } catch (err) {
                    logger.error(`Error processing email ${email.id}: ${err}`, { error: err });
                    return null;
                }
            });
            const validEmails = parsedEmails.filter((email) => email !== null);
            if (validEmails.length === 0) {
                return { emails: [], lastSyncCursor: '' };
            }

            validEmails.sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());
            const lastSyncCursor = validEmails[0].historyId;

            return { emails: validEmails.map((email) => email.emailObject), lastSyncCursor };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailService.parseEmailsIntoPlainObjects: ${errorMessage}`, { error: err });
            throw err;
        }
    }

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

    async searchContacts(accountId: string, searchText: string): Promise<SearchOtherContactsResponse[]> {
        try {
            const response = await GmailClient.searchContacts(accountId, searchText);
            const contacts =
                response.results
                    ?.map((result) => {
                        const email = result.person.emailAddresses?.[0]?.value || '';
                        return {
                            name: result.person.names?.[0]?.displayName || email,
                            email: email,
                        };
                    })
                    .filter((contact) => contact.email !== '') || [];
            return contacts;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailService.searchContacts: ${errorMessage}`, { error: err });
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
