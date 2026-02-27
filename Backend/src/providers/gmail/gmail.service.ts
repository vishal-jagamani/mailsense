import { ACCOUNT_FETCH_ACCESS_TOKEN_DB_FIELD_MAPPING } from '@modules/accounts/account.constants.js';
import { AccountRepository } from '@modules/accounts/account.repository.js';
import { EmailInput } from '@modules/emails/email.model.js';
import { EmailRepository } from '@modules/emails/email.repository.js';
import { BatchProcessor } from '@utils/batchProcessor.js';
import { compressString } from '@utils/compression.js';
import { logger } from '@utils/logger.js';
import axios from 'axios';
import { GmailOAuthAccessTokenResponse } from 'types/account.types.js';
import { GmailApi } from './gmail.api.js';
import {
    ExtractMessageChangesResponse,
    GetGmailMessagesResponse,
    GMAIL_LABELS,
    GmailHistoryResponse,
    GmailMessage,
    GmailMessageObjectFull,
    GmailMessages,
    GmailParsedEmailResult,
    GmailUserProfile,
    MessagesAfterLastHistoryResponse,
} from './gmail.types.js';
import * as GmailUtils from './gmail.utils.js';
import * as Sentry from '@sentry/node';

export class GmailService {
    async getAccessTokenFromCode(code: string): Promise<GmailOAuthAccessTokenResponse> {
        try {
            const response = await GmailApi.getAccessTokenFromCode(code);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailService.getAccessTokenFromCode: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async getUserProfileFromAccessToken(accessToken: string): Promise<GmailUserProfile> {
        try {
            const response = await GmailApi.getUserProfileFromAccessToken(accessToken);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailService.getUserProfileFromAccessToken: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async getMessages(accountId: string): Promise<GetGmailMessagesResponse> {
        try {
            const account = await AccountRepository.getAccountById(
                accountId,
                ACCOUNT_FETCH_ACCESS_TOKEN_DB_FIELD_MAPPING.FETCH_ACCESS_TOKEN.projection,
            );
            if (!account) throw new Error('Account not found');
            const emails = await GmailApi.fetchEmails(accountId, 500);
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
                const emailDetails = await GmailApi.fetchEmailById(messageId, accountId);
                const emailObject = this.transformGmailMessageToEmailInput(emailDetails, accountId);
                emails.push(emailObject);
            }
            return emails;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailService.getMessagesByMessagesId: ${errorMessage}`, { error: err });
            Sentry.captureException(err);
            throw err;
        }
    }

    async getMessagesAfterLastHistory(accountId: string, historyId: string): Promise<MessagesAfterLastHistoryResponse | null> {
        try {
            if (!historyId) return null;
            const historyDetails = await GmailApi.getHistory(accountId, historyId);
            if (!historyDetails) return null;
            const { addedMessageIds, deletedMessageIds } = this.extractMessageChanges(historyDetails);
            const addedMessages: EmailInput[] = [];
            if (addedMessageIds.length) {
                for (const messageId of addedMessageIds) {
                    const emailDetails = await GmailApi.fetchEmailById(messageId, accountId);
                    const emailObject = this.transformGmailMessageToEmailInput(emailDetails, accountId);
                    addedMessages.push(emailObject);
                }
            }
            return { addedMessages, deletedMessages: deletedMessageIds, newHistoryId: historyDetails.historyId };
        } catch (err) {
            if (axios.isAxiosError(err) && err?.response?.status === 404) {
                return null;
            } else {
                const errorMessage = err instanceof Error ? err.message : String(err);
                logger.error(`Error in GmailService.getMessagesAfterLastHistory: ${errorMessage}`, { error: err });
                throw err;
            }
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

            const parsedEmails = await batchProcessor.processBatches(emails.messages, async (email: { id: string; threadId: string }) => {
                try {
                    const emailDetails = await GmailApi.fetchEmailById(email.id, accountId);
                    const emailObject = this.transformGmailMessageToEmailInput(emailDetails, accountId);
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

    private transformGmailMessageToEmailInput(emailDetails: GmailMessageObjectFull, accountId: string): EmailInput {
        const headers = emailDetails.payload.headers.reduce(
            (acc, header) => {
                acc[header.name.toLowerCase()] = header.value;
                return acc;
            },
            {} as Record<string, string>,
        );
        const { plainTextBody, htmlBody } = GmailUtils.parseEmailBody(emailDetails);
        const receivedAt = new Date(headers.date || '');
        return {
            accountId,
            providerMessageId: emailDetails.id,
            threadId: emailDetails.threadId,
            from: headers.from || '',
            to: headers.to || '',
            cc: headers.cc || '',
            bcc: headers.bcc || '',
            subject: headers.subject || '',
            body: emailDetails.payload.body.data || '',
            bodyHtml: compressString(htmlBody || ''),
            bodyPlain: compressString(plainTextBody),
            receivedAt,
            isRead: !emailDetails.labelIds.includes(GMAIL_LABELS.UNREAD),
            folders: emailDetails.labelIds,
        };
    }

    async deleteEmails(emailIds: string[], accountId: string, trash?: boolean) {
        try {
            if (trash) {
                for (const emailId of emailIds) {
                    const email = await GmailApi.trashEmail(emailId, accountId);
                    await EmailRepository.updateEmailByProviderMessageId(email.id, {
                        folders: email?.labelIds || [],
                    });
                    await AccountRepository.updateAccount(accountId, { lastSyncCursor: email.historyId });
                }
                return;
            } else {
                const response = await GmailApi.permanentlyDeleteEmails(emailIds, accountId);
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
                const email = await GmailApi.archiveEmail(emailId, accountId, archive);
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

    async starEmails(emails: { id: string; providerMessageId: string }[], accountId: string, star: boolean) {
        try {
            for (const email of emails) {
                const updatedEmail = await GmailApi.starEmail(email.providerMessageId, accountId, star);
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
                const email = await GmailApi.unreadEmail(emailId, accountId, unread);
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
}
