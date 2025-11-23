import { ACCOUNT_FETCH_ACCESS_TOKEN_DB_FIELD_MAPPING } from '@modules/accounts/account.constants.js';
import { AccountRepository } from '@modules/accounts/account.repository.js';
import { EmailInput } from '@modules/emails/email.model.js';
import { EmailRepository } from '@modules/emails/email.repository.js';
import { compressString } from '@utils/compression.js';
import { logger } from '@utils/logger.js';
import { GmailOAuthAccessTokenResponse } from 'types/account.types.js';
import { GmailApi } from './gmail.api.js';
import { GmailMessages, GmailUserProfile } from './gmail.types.js';
import * as GmailUtils from './gmail.utils.js';

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

    async getMessages(accountId: string): Promise<EmailInput[]> {
        try {
            const account = await AccountRepository.getAccountById(
                accountId,
                ACCOUNT_FETCH_ACCESS_TOKEN_DB_FIELD_MAPPING.FETCH_ACCESS_TOKEN.projection,
            );
            if (!account) throw new Error('Account not found');
            const emails = await GmailApi.fetchEmails(accountId, 500);
            const parsedEmails = await this.parseEmailsIntoPlainObjects(accountId, emails);
            return parsedEmails;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailService.getMessages: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async parseEmailsIntoPlainObjects(accountId: string, emails: GmailMessages): Promise<EmailInput[]> {
        try {
            const parsedEmails = emails.messages.map(async (email: { id: string; threadId: string }) => {
                const emailDetails = await GmailApi.fetchEmailById(email.id, accountId);
                const { plainTextBody, htmlBody } = GmailUtils.parseEmailBody(emailDetails);
                const emailObject: EmailInput = {
                    accountId,
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

    async deleteEmails(emailIds: string[], accountId: string, trash?: boolean) {
        try {
            if (trash) {
                for (const emailId of emailIds) {
                    const email = await GmailApi.trashEmail(emailId, accountId);
                    await EmailRepository.updateEmail(email.id, email);
                }
                return;
            } else {
                const response = await GmailApi.permanentlyDeleteEmails(emailIds, accountId);
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
}
