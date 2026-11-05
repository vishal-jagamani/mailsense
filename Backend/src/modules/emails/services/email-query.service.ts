import { LOGGER_MODULE } from '@constants';
import { ForbiddenError, NotFoundError } from '@errors';
import { EmailProviderFactory } from '@integrations/email/email.provider.factory.js';
import {
    ACCOUNT_PROVIDER,
    APIResponse,
    DATE_RANGE,
    GetAllEmailsFilters,
    GetEmailsResponse,
    GetFiltersResponse,
    GMAIL_LABELS,
    PaginatedDataResponse,
    SearchEmailsParams,
    SearchOtherContactsResponse,
} from '@mailsense/types';
import { AccountDocument } from '@modules/accounts/account.model.js';
import { AccountRepository } from '@modules/accounts/account.repository.js';
import { FolderRepository } from '@modules/folders/folder.repository.js';
import { createLogger } from '@observability';
import { GetDataRangeResponse } from '@types';
import { decompressString } from '@utils';
import { FilterQuery, FlattenMaps } from 'mongoose';
import { EmailDocument } from '../database/email.model.js';
import { EmailRepository } from '../database/email.repository.js';
import { EMAIL_LIST_DB_FIELD_MAPPING } from '../email.constants.js';
import { EmailListItem, GroupedEmailThreadItem } from '../email.types.js';

const logger = createLogger(LOGGER_MODULE.EMAIL_SERVICE);

export class EmailQueryService {
    private resolveTargetAccountIds(accounts: AccountDocument[], accountId?: string[]): string[] {
        if (accountId && accountId.length > 0) {
            return accountId.map(String);
        }
        return accounts.map((account) => String(account._id));
    }

    private buildEmailSearchQuery(
        targetAccountIds: string[],
        targetFolders: string[] | undefined,
        folderIds: string[],
        filters: GetAllEmailsFilters,
        computedDateRange?: GetDataRangeResponse,
    ): FilterQuery<EmailDocument> {
        const { searchText, unread } = filters;
        const query: FilterQuery<EmailDocument> = {
            accountId: { $in: targetAccountIds },
            folders: targetFolders ? { $in: targetFolders } : { $nin: [GMAIL_LABELS.TRASH, GMAIL_LABELS.SPAM, GMAIL_LABELS.SENT, ...folderIds] },
        };

        if (searchText) {
            query.$or = [{ subject: { $regex: searchText, $options: 'i' } }, { from: { $regex: searchText, $options: 'i' } }];
        }
        if (computedDateRange) {
            query.receivedAt = { $gte: computedDateRange.startDate, $lte: computedDateRange.endDate };
        }
        if (unread) {
            query.isRead = false;
        }

        return query;
    }

    private mapEmailToListItem(email: FlattenMaps<EmailDocument> & GroupedEmailThreadItem): EmailListItem {
        return {
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
            hasAttachments: Boolean(email.attachments && email.attachments.length > 0),
            ...(email.bodyPlain && { bodyPlain: decompressString(email.bodyPlain) }),
        };
    }

    public async getAllEmails(userId: string, size: number, page: number, filters: GetAllEmailsFilters): Promise<GetEmailsResponse> {
        try {
            const accounts = await AccountRepository.getAccounts({ userId, active: true });
            if (!accounts.length) {
                return { data: [], size: 0, page: 0, total: 0 };
            }

            const { folderIds, targetFolders } = await this.getFoldersIdsForEmailsQuery(accounts, filters.folders);
            const targetAccountIds = this.resolveTargetAccountIds(accounts, filters.accountId);
            const computedDateRange = filters.dateRange ? this.getDateRange(filters.dateRange) : undefined;
            const searchQuery = this.buildEmailSearchQuery(targetAccountIds, targetFolders, folderIds, filters, computedDateRange);

            const emails = await EmailRepository.getGroupedEmails(searchQuery, size, page, EMAIL_LIST_DB_FIELD_MAPPING.LIST.projection);
            const total = await EmailRepository.countGroupedThreads(searchQuery);
            const data = emails.map((email) => this.mapEmailToListItem(email));

            return { data, size, page, total };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.getAllEmails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    private async getFoldersIdsForEmailsQuery(accounts: AccountDocument[], folders?: string[]) {
        try {
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
            let targetFolders = folders;
            if (folders && folders.length > 0) {
                const folderDocs = await FolderRepository.getFoldersByIds(folders);
                if (folderDocs.length > 0) {
                    const folderMap = new Map<string, string>();
                    folderDocs.forEach((f) => folderMap.set(String(f._id), f.providerFolderId));
                    targetFolders = folders.map((id) => folderMap.get(id) || id);
                }
            }
            return { folderIds, targetFolders };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.getFoldersForEmails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    private getDateRange(dateRange: DATE_RANGE): GetDataRangeResponse {
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

    public async getEmails(userId: string, accountId: string, size: number, page: number): Promise<GetEmailsResponse> {
        try {
            const account = await AccountRepository.getAccountById(accountId);
            if (!account) {
                throw new NotFoundError('Account', accountId);
            }

            if (account.userId !== userId) {
                throw new ForbiddenError('Unauthorized attempt to access emails');
            }

            const emails = await EmailRepository.getGroupedEmails({ accountId }, size, page, EMAIL_LIST_DB_FIELD_MAPPING.LIST.projection);
            const total = await EmailRepository.countGroupedThreads({ accountId });

            const data = emails.map((email) => this.mapEmailToListItem(email));
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
            const total = await EmailRepository.countDocuments(searchQuery);
            return { data: emails, size, page, total };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.searchEmails: ${errorMessage}`, { error: err });
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
}
