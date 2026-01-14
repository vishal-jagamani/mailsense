import { AccountRepository } from '@modules/accounts/account.repository.js';
import { EmailRepository } from '@modules/emails/email.repository.js';
import { GmailService } from '@providers/gmail/gmail.service.js';
import { decompressString } from '@utils/compression.js';
import { logger } from '@utils/logger.js';
import { FilterQuery } from 'mongoose';
import { AccountProvider } from 'types/account.types.js';
import { UpdateAPIResponse } from 'types/api.types.js';
import { GetEmailsResponse } from 'types/email.types.js';
import { EMAIL_LIST_DB_FIELD_MAPPING } from './email.constants.js';
import { EmailDocument } from './email.model.js';

export class EmailService {
    private gmailService: GmailService;

    constructor() {
        this.gmailService = new GmailService();
    }

    public async getAllEmails(userId: string, size: number, page: number): Promise<GetEmailsResponse> {
        try {
            const accounts = await AccountRepository.getAccounts(userId);
            if (!accounts.length) {
                return { data: [], size: 0, page: 0, total: 0 };
            }
            const emails = await EmailRepository.getEmailsByAccountIds(
                accounts.map((account) => String(account._id)),
                size,
                page,
                EMAIL_LIST_DB_FIELD_MAPPING.LIST.projection,
                EMAIL_LIST_DB_FIELD_MAPPING.SORT.sort,
            );
            const total = await EmailRepository.countDocuments(accounts.map((account) => String(account._id)));
            const data = emails.map((email) => ({
                _id: email._id.toString(),
                subject: email.subject,
                from: email.from,
                receivedAt: email.receivedAt,
                isRead: email.isRead,
                providerMessageId: email.providerMessageId,
                accountId: email.accountId,
                ...(email.body && { body: decompressString(email.body) }),
                ...(email.bodyHtml && { bodyHtml: decompressString(email.bodyHtml) }),
                ...(email.bodyPlain && { bodyPlain: decompressString(email.bodyPlain) }),
            }));
            return { data, size, page, total };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.getAllEmails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async getEmails(accountId: string, size: number, page: number): Promise<GetEmailsResponse> {
        try {
            const emails = await EmailRepository.getEmailsByAccountId(
                accountId,
                size,
                page,
                EMAIL_LIST_DB_FIELD_MAPPING.LIST.projection,
                EMAIL_LIST_DB_FIELD_MAPPING.SORT.sort,
            );
            const total = await EmailRepository.countDocuments([accountId]);
            const data = emails.map((email) => ({
                _id: email._id.toString(),
                subject: email.subject,
                from: email.from,
                receivedAt: email.receivedAt,
                providerMessageId: email.providerMessageId,
                accountId: email.accountId,
                isRead: email.isRead,
                ...(email.body && { body: decompressString(email.body) }),
                ...(email.bodyHtml && { bodyHtml: decompressString(email.bodyHtml) }),
                ...(email.bodyPlain && { bodyPlain: decompressString(email.bodyPlain) }),
            }));
            return { data, size, page, total };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.getEmails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async getEmail(emailId: string): Promise<EmailDocument | null> {
        try {
            const email = await EmailRepository.getEmail(emailId);
            if (!email) throw new Error('Email not found');
            email.bodyHtml = decompressString(email.bodyHtml);
            email.bodyPlain = decompressString(email.bodyPlain);
            // email.body = decompressString(email.body);
            return email;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.getEmail: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async searchEmails(userId: string, searchText: string) {
        try {
            const accounts = await AccountRepository.getAccounts(userId);
            if (!accounts.length) {
                return { data: [], size: 0, page: 0, total: 0 };
            }
            const searchQuery: FilterQuery<EmailDocument> = {
                accountId: { $in: accounts.map((account) => account._id) },
                $or: [{ subject: { $regex: searchText, $options: 'i' } }, { from: { $regex: searchText, $options: 'i' } }],
            };
            const emails = await EmailRepository.searchEmails(searchQuery, EMAIL_LIST_DB_FIELD_MAPPING.LIST.projection);
            return { data: emails, size: emails.length, page: 1, total: emails.length };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.searchEmails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async deleteEmail(emailIds: string[], trash?: boolean): Promise<void> {
        try {
            const emails = await EmailRepository.getEmailsByProviderMessageIds(emailIds, EMAIL_LIST_DB_FIELD_MAPPING.LIST.projection);
            if (!emails.length) {
                throw new Error('Email not found');
            }
            const groupedEmails = Object.groupBy(emails, (item) => item.accountId);
            for (const [accountId, emails] of Object.entries(groupedEmails)) {
                const account = await AccountRepository.getAccountById(accountId, { provider: 1 });
                if (!account || !emails) continue;
                if (account.provider === AccountProvider.GMAIL) {
                    await this.gmailService.deleteEmails(
                        emails.map((email) => email.providerMessageId),
                        accountId,
                        trash,
                    );
                } else if (account.provider === AccountProvider.OUTLOOK) {
                    // Outlook provider deletion
                    // await this.outlookService.deleteEmails(
                    //     emails.map((email) => email.providerMessageId),
                    //     accountId,
                    //     trash,
                    // );
                }
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.getEmail: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async archiveEmails(emailIds: string[], archive: boolean): Promise<UpdateAPIResponse> {
        try {
            const emails = await EmailRepository.getEmailsByProviderMessageIds(emailIds, EMAIL_LIST_DB_FIELD_MAPPING.LIST.projection);
            if (!emails.length) {
                throw new Error('Email not found');
            }
            const groupedEmails = Object.groupBy(emails, (item) => item.accountId);
            for (const [accountId, emails] of Object.entries(groupedEmails)) {
                const account = await AccountRepository.getAccountById(accountId, { provider: 1 });
                if (!account || !emails) continue;
                if (account.provider === AccountProvider.GMAIL) {
                    await this.gmailService.archiveEmails(
                        emails.map((email) => email.providerMessageId),
                        accountId,
                        archive,
                    );
                } else if (account.provider === AccountProvider.OUTLOOK) {
                    // Outlook provider deletion
                    // await this.outlookService.deleteEmails(
                    //     emails.map((email) => email.providerMessageId),
                    //     accountId,
                    //     trash,
                    // );
                }
            }
            return { status: true, message: 'Emails archived successfully' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.getEmail: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async starEmails(emailIds: string[], star: boolean): Promise<UpdateAPIResponse> {
        try {
            const emails = await EmailRepository.getEmailsByProviderMessageIds(emailIds, EMAIL_LIST_DB_FIELD_MAPPING.LIST.projection);
            if (!emails.length) {
                throw new Error('Email not found');
            }
            const groupedEmails = Object.groupBy(emails, (item) => item.accountId);
            for (const [accountId, emails] of Object.entries(groupedEmails)) {
                const account = await AccountRepository.getAccountById(accountId, { provider: 1 });
                if (!account || !emails) continue;
                if (account.provider === AccountProvider.GMAIL) {
                    await this.gmailService.starEmails(
                        emails.map((email) => email.providerMessageId),
                        accountId,
                        star,
                    );
                } else if (account.provider === AccountProvider.OUTLOOK) {
                    // Outlook provider deletion
                    // await this.outlookService.deleteEmails(
                    //     emails.map((email) => email.providerMessageId),
                    //     accountId,
                    //     trash,
                    // );
                }
            }
            return { status: true, message: `${star ? 'Starred' : 'Unstarred'} emails successfully` };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.getEmail: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async unreadEmails(emailIds: string[]): Promise<UpdateAPIResponse> {
        try {
            const emails = await EmailRepository.getEmailsByProviderMessageIds(emailIds, EMAIL_LIST_DB_FIELD_MAPPING.LIST.projection);
            if (!emails.length) {
                throw new Error('Email not found');
            }
            const groupedEmails = Object.groupBy(emails, (item) => item.accountId);
            for (const [accountId, emails] of Object.entries(groupedEmails)) {
                const account = await AccountRepository.getAccountById(accountId, { provider: 1 });
                if (!account || !emails) continue;
                if (account.provider === AccountProvider.GMAIL) {
                    await this.gmailService.unreadEmails(
                        emails.map((email) => email.providerMessageId),
                        accountId,
                    );
                } else if (account.provider === AccountProvider.OUTLOOK) {
                    // Outlook provider deletion
                    // await this.outlookService.deleteEmails(
                    //     emails.map((email) => email.providerMessageId),
                    //     accountId,
                    //     trash,
                    // );
                }
            }
            return { status: true, message: 'Unread emails successfully' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.getEmail: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
