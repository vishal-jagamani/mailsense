import { FilterQuery } from 'mongoose';

import { EmailProviderFactory } from '@integrations/email/email.provider.factory.js';
import {
    ACCOUNT_PROVIDER,
    APIResponse,
    DATE_RANGE,
    GetAllEmailsFilters,
    GetEmailsResponse,
    GetFiltersResponse,
    GetThreadResponse,
    GMAIL_LABELS,
    PaginatedDataResponse,
    SearchEmailsParams,
    SearchOtherContactsResponse,
    SuccessAPIResponse,
    UpdateAPIResponse,
} from '@mailsense/types';
import { AccountRepository } from '@modules/accounts/account.repository.js';
import { AttachmentsService } from '@modules/attachments/attachment.service.js';
import { EmailRepository } from '@modules/emails/email.repository.js';
import { FolderRepository } from '@modules/folders/folder.repository.js';
import { decompressString, logger } from 'shared/utils/index.js';
import { EMAIL_LIST_DB_FIELD_MAPPING } from './email.constants.js';
import { EmailDocument, EmailInput } from './email.model.js';
import { ComposeEmailBody } from './email.schema.js';

export class EmailService {
    private attachmentsService: AttachmentsService;

    constructor() {
        this.attachmentsService = new AttachmentsService();
    }

    public async getAllEmails(userId: string, size: number, page: number, filters: GetAllEmailsFilters): Promise<GetEmailsResponse> {
        try {
            const { searchText, accountId, dateRange, folders, unread } = filters;
            const accounts = await AccountRepository.getAccounts({ userId, active: true });
            if (!accounts.length) {
                return { data: [], size: 0, page: 0, total: 0 };
            }
            const outlookAccounts = accounts.filter((account) => account.provider === ACCOUNT_PROVIDER.OUTLOOK);
            let folderIds: string[] = [];
            if (outlookAccounts.length) {
                const folders = await FolderRepository.getAllFolders(
                    {
                        accountId: { $in: outlookAccounts.map((account) => account._id) },
                        kind: 'SYSTEM',
                    },
                    1000,
                    1,
                    { name: 1, _id: 1, providerFolderId: 1 },
                    {},
                );
                folderIds = folders.map((folder) => folder.providerFolderId);
            }
            const targetAccountIds = accountId?.length ? accountId.map(String) : accounts.map((account) => String(account._id));
            const searchQuery: FilterQuery<EmailDocument> = {
                accountId: { $in: targetAccountIds },
                folders: folders ? { $in: folders } : { $nin: [GMAIL_LABELS.TRASH, GMAIL_LABELS.SPAM, GMAIL_LABELS.SENT, ...folderIds] },
                ...(searchText && { $or: [{ subject: { $regex: searchText, $options: 'i' } }, { from: { $regex: searchText, $options: 'i' } }] }),
                ...(dateRange &&
                    this.getDateRange(dateRange) && {
                        receivedAt: { $gte: this.getDateRange(dateRange).startDate, $lte: this.getDateRange(dateRange).endDate },
                    }),
                ...(unread && { isRead: false }),
            };
            const emails = await EmailRepository.getGroupedEmails(searchQuery, size, page, EMAIL_LIST_DB_FIELD_MAPPING.LIST.projection);
            const total = await EmailRepository.countGroupedThreads(searchQuery);
            const data = emails.map((email) => ({
                _id: email._id.toString(),
                subject: email.subject,
                from: email.from,
                receivedAt: email.receivedAt,
                isRead: email.isRead,
                providerMessageId: email.providerMessageId,
                accountId: email.accountId,
                threadId: email.threadId,
                threadCount: email.threadCount || 1,
                attachments: email.attachments || [],
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

    private getDateRange(dateRange: DATE_RANGE): { startDate: Date; endDate: Date } {
        const now = new Date();
        const endDate = new Date(now);

        switch (dateRange) {
            case DATE_RANGE.TODAY: {
                const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
                const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
                return { startDate, endDate: endOfDay };
            }
            case DATE_RANGE.LAST_WEEK: {
                const startDate = new Date(now);
                startDate.setUTCDate(startDate.getUTCDate() - 7);
                return { startDate, endDate };
            }
            case DATE_RANGE.LAST_MONTH: {
                const startDate = new Date(now);
                startDate.setUTCMonth(startDate.getUTCMonth() - 1);
                return { startDate, endDate };
            }
            case DATE_RANGE.LAST_3_MONTHS: {
                const startDate = new Date(now);
                startDate.setUTCMonth(startDate.getUTCMonth() - 3);
                return { startDate, endDate };
            }
            case DATE_RANGE.ALL_TIME:
            default:
                return { startDate: new Date(0), endDate };
        }
    }

    public async getEmails(accountId: string, size: number, page: number): Promise<GetEmailsResponse> {
        try {
            const emails = await EmailRepository.getGroupedEmails({ accountId }, size, page, EMAIL_LIST_DB_FIELD_MAPPING.LIST.projection);
            const total = await EmailRepository.countGroupedThreads({ accountId });
            const data = emails.map((email) => ({
                _id: email._id.toString(),
                subject: email.subject,
                from: email.from,
                receivedAt: email.receivedAt,
                providerMessageId: email.providerMessageId,
                accountId: email.accountId,
                threadId: email.threadId,
                threadCount: email.threadCount || 1,
                isRead: email.isRead,
                attachments: email.attachments || [],
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

    public async getFilters(userId: string): Promise<GetFiltersResponse> {
        try {
            const accounts = await AccountRepository.getAccounts({ userId, active: true });
            const folders = await FolderRepository.getAllFolders(
                { accountId: { $in: accounts.map((account) => account._id) }, kind: 'SYSTEM' },
                1000,
                1,
                { name: 1, _id: 1, providerFolderId: 1 },
                {},
            );
            const accountsData = accounts.map((account) => ({
                id: account._id.toString(),
                provider: account.provider,
                emailAddress: account.emailAddress,
            }));
            const foldersData = folders.map((folder) => ({
                id: folder._id.toString(),
                name: folder.name,
                providerFolderId: folder.providerFolderId,
            }));
            return { accounts: accountsData, folders: foldersData };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.getFilters: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async getEmail(emailId: string): Promise<EmailDocument | EmailInput | null> {
        try {
            const email = await EmailRepository.getEmail(emailId);
            if (!email) throw new Error('Email not found');
            const account = await AccountRepository.getAccountById(email.accountId, { provider: 1 });
            if (!account) throw new Error('Account not found');
            const provider = EmailProviderFactory.getProvider(account.provider as ACCOUNT_PROVIDER);
            return provider.getMessageDetails(email.accountId, email.providerMessageId, email);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.getEmail: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async searchEmails(params: SearchEmailsParams): Promise<PaginatedDataResponse<EmailDocument>> {
        try {
            const { userId, searchText, size, page } = params;
            const accounts = await AccountRepository.getAccounts({ userId, active: true });
            if (!accounts.length) {
                return { data: [], size: 0, page: 0, total: 0 };
            }
            const searchQuery: FilterQuery<EmailDocument> = {
                accountId: { $in: accounts.map((account) => account._id) },
                $or: [{ subject: { $regex: searchText, $options: 'i' } }, { from: { $regex: searchText, $options: 'i' } }],
            };
            const emails = await EmailRepository.searchEmails(searchQuery, EMAIL_LIST_DB_FIELD_MAPPING.LIST.projection, size, page, {
                receivedAt: -1,
            });
            return { data: emails, size, page, total: emails.length };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.searchEmails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async deleteEmail(emailIds: string[], trash?: boolean): Promise<UpdateAPIResponse> {
        try {
            const emailList = await EmailRepository.getEmailsByProviderMessageIds(emailIds, EMAIL_LIST_DB_FIELD_MAPPING.LIST.projection);
            if (!emailList.length) {
                throw new Error('Email not found');
            }
            const groupedEmails = Object.groupBy(emailList, (item) => item.accountId);
            for (const [accountId, emails] of Object.entries(groupedEmails)) {
                const account = await AccountRepository.getAccountById(accountId, { provider: 1 });
                if (!account || !emails) continue;
                const provider = EmailProviderFactory.getProvider(account.provider as ACCOUNT_PROVIDER);
                await provider.deleteEmails(
                    emails.map((email) => email.providerMessageId),
                    accountId,
                    trash,
                );
            }
            return { status: true, message: 'Email deleted successfully' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.deleteEmail: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async archiveEmails(emailIds: string[], archive: boolean): Promise<UpdateAPIResponse> {
        try {
            const emailList = await EmailRepository.getEmailsByProviderMessageIds(emailIds, EMAIL_LIST_DB_FIELD_MAPPING.LIST.projection);
            if (!emailList.length) {
                throw new Error('Email not found');
            }
            const groupedEmails = Object.groupBy(emailList, (item) => item.accountId);
            for (const [accountId, emails] of Object.entries(groupedEmails)) {
                const account = await AccountRepository.getAccountById(accountId, { provider: 1 });
                if (!account || !emails) continue;
                const provider = EmailProviderFactory.getProvider(account.provider as ACCOUNT_PROVIDER);
                await provider.archiveEmails(
                    emails.map((email) => email.providerMessageId),
                    accountId,
                    archive,
                );
            }
            return { status: true, message: 'Emails archived successfully' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.archiveEmails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async starEmails(emailIds: string[], star: boolean): Promise<UpdateAPIResponse> {
        try {
            const emailList = await EmailRepository.getEmailsByProviderMessageIds(emailIds, EMAIL_LIST_DB_FIELD_MAPPING.LIST.projection);
            if (!emailList.length) {
                throw new Error('Email not found');
            }
            const groupedEmails = Object.groupBy(emailList, (item) => item.accountId);
            for (const [accountId, emails] of Object.entries(groupedEmails)) {
                const account = await AccountRepository.getAccountById(accountId, { provider: 1 });
                if (!account || !emails) continue;
                const provider = EmailProviderFactory.getProvider(account.provider as ACCOUNT_PROVIDER);
                await provider.starEmails(
                    emails.map((email) => ({ id: String(email._id), providerMessageId: email.providerMessageId })),
                    accountId,
                    star,
                );
            }
            return { status: true, message: `${star ? 'Starred' : 'Unstarred'} emails successfully` };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.starEmails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async unreadEmails(emailIds: string[], unread: boolean): Promise<UpdateAPIResponse> {
        try {
            const emailList = await EmailRepository.getEmailsByProviderMessageIds(emailIds, EMAIL_LIST_DB_FIELD_MAPPING.LIST.projection);
            if (!emailList.length) {
                throw new Error('Email not found');
            }
            const groupedEmails = Object.groupBy(emailList, (item) => item.accountId);
            for (const [accountId, emails] of Object.entries(groupedEmails)) {
                const account = await AccountRepository.getAccountById(accountId, { provider: 1 });
                if (!account || !emails) continue;
                const provider = EmailProviderFactory.getProvider(account.provider as ACCOUNT_PROVIDER);
                await provider.unreadEmails(
                    emails.map((email) => email.providerMessageId),
                    accountId,
                    unread,
                );
            }
            return { status: true, message: 'Unread emails successfully' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.unreadEmails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async composeEmail(userId: string, composeEmailData: ComposeEmailBody): Promise<SuccessAPIResponse> {
        try {
            const account = await AccountRepository.getAccountById(composeEmailData.accountId, { provider: 1 });
            if (!account) {
                throw new Error('Account not found');
            }
            if (composeEmailData.attachmentIds && composeEmailData.attachmentIds.length) {
                return await this.composeEmailWithAttachments(userId, composeEmailData);
            } else {
                const provider = EmailProviderFactory.getProvider(account.provider as ACCOUNT_PROVIDER);
                await provider.sendMail(composeEmailData);
                return { status: true, message: 'Email composed successfully' };
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.composeEmail: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async searchOtherContacts(userId: string, searchText: string): Promise<APIResponse<SearchOtherContactsResponse[]>> {
        try {
            const accounts = await AccountRepository.getAccounts({ userId, active: true });
            if (!accounts.length) {
                return { status: false, message: 'No accounts found', data: [] };
            }
            const contacts = accounts.map((account) => {
                const provider = EmailProviderFactory.getProvider(account.provider as ACCOUNT_PROVIDER);
                return provider.searchContacts(account._id.toString(), searchText).catch(() => []);
            });
            const results = await Promise.all(contacts);
            const allContacts = results.flat();
            const mergedContacts = allContacts.filter((contact, index, self) => index === self.findIndex((c) => c.email === contact.email));
            return { status: true, message: 'Search other contacts successfully', data: mergedContacts };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.searchOtherContacts: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async getThread(emailId: string): Promise<GetThreadResponse> {
        try {
            const email = await EmailRepository.getEmail(emailId);
            if (!email) {
                throw new Error('Email not found');
            }

            const threadEmails = await EmailRepository.getEmailsByThreadId(email.threadId, email.accountId);

            const decompressedThread = threadEmails.map((item) => ({
                ...item,
                _id: item._id.toString(),
                bodyHtml: item.bodyHtml ? decompressString(item.bodyHtml) : '',
                bodyPlain: item.bodyPlain ? decompressString(item.bodyPlain) : '',
            }));

            return {
                thread: decompressedThread,
                threadId: email.threadId,
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.getThread: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async downloadAttachment(emailId: string, attachmentId: string): Promise<{ data: Buffer; mimeType: string; filename: string }> {
        try {
            const email = await EmailRepository.getEmail(emailId);
            if (!email) {
                throw new Error('Email not found');
            }

            const account = await AccountRepository.getAccountById(email.accountId);
            if (!account) {
                throw new Error('Account not found');
            }

            const attachment = (email.attachments || []).find((att) => att.attachmentId === attachmentId);

            const provider = EmailProviderFactory.getProvider(account.provider);
            const result = await provider.getAttachment(email.accountId, email.providerMessageId, attachmentId);

            return {
                data: result.data,
                mimeType: attachment?.mimeType || result.mimeType || 'application/octet-stream',
                filename: attachment?.filename || result.filename || 'attachment',
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.downloadAttachment: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    private async composeEmailWithAttachments(userId: string, reqBody: ComposeEmailBody): Promise<SuccessAPIResponse> {
        try {
            const { accountId, to, subject, body, attachmentIds } = reqBody;

            const account = await AccountRepository.getAccountById(accountId);
            if (!account || account.userId.toString() !== userId.toString()) {
                throw new Error('Account not found or unauthorized');
            }

            const stagedFiles: { filename: string; mimeType: string; buffer: Buffer }[] = [];
            if (attachmentIds && attachmentIds.length > 0) {
                for (const attId of attachmentIds) {
                    const { stagedAttachment, stream } = await this.attachmentsService.getStagedAttachmentWithStream(attId);

                    // Verify attachment belongs to user and matches target account
                    // if (stagedAttachment.userId.toString() !== userId.toString() || stagedAttachment.accountId !== accountId) {
                    //     throw new Error(`Unauthorized or invalid attachment ${attId}`);
                    // }

                    const chunks: Buffer[] = [];
                    for await (const chunk of stream) {
                        chunks.push(Buffer.from(chunk));
                    }
                    stagedFiles.push({
                        filename: stagedAttachment.filename,
                        mimeType: stagedAttachment.mimeType,
                        buffer: Buffer.concat(chunks),
                    });
                }
            }

            const provider = EmailProviderFactory.getProvider(account.provider);
            await provider.sendMail({ accountId, to, subject, body, attachments: stagedFiles });

            if (attachmentIds && attachmentIds.length > 0) {
                this.attachmentsService.cleanupStagedAttachments(attachmentIds);
            }

            return { status: true, message: 'Email composed and sent successfully' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.composeEmailWithAttachments: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
