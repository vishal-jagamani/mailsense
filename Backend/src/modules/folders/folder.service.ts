import { EmailProviderFactory } from '@integrations/email/email.provider.factory.js';
import { ACCOUNT_PROVIDER, GetAllFoldersFilters, PaginatedDataResponse, UpdateAPIResponse } from '@mailsense/types';
import { AccountRepository } from '@modules/accounts/account.repository.js';
import { FilterQuery } from 'mongoose';
import { getDateRange, logger } from 'shared/utils/index.js';
import { FOLDER_LIST_DB_FIELD_MAPPING } from './folder.constants.js';
import { FolderDocument } from './folder.model.js';
import { FolderRepository } from './folder.repository.js';

export class FolderService {
    constructor() {}

    public async syncFolders(accountId: string): Promise<UpdateAPIResponse> {
        try {
            const account = await AccountRepository.getAccountById(accountId, { provider: 1, userId: 1 });
            if (!account) {
                throw new Error('Account not found');
            }
            const provider = EmailProviderFactory.getProvider(account.provider as ACCOUNT_PROVIDER);
            const folderInputs = await provider.getAllFolders(accountId, account.userId);
            await FolderRepository.upsertFoldersInBulk(folderInputs);
            return { status: true, message: 'Folders synced successfully' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in FolderService.syncFolders: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async getAllFolders(
        userId: string,
        size: number,
        page: number,
        filters: GetAllFoldersFilters,
    ): Promise<PaginatedDataResponse<FolderDocument>> {
        try {
            const { searchText, accountId, dateRange } = filters;
            const accounts = await AccountRepository.getAccounts({ userId, active: true });
            if (!accounts.length) {
                return { data: [], size: 0, page: 0, total: 0 };
            }
            const filterQuery: FilterQuery<FolderDocument> = {
                accountId: { $in: accountId?.length ? accountId : accounts.map((account) => account._id) },
                ...(searchText && { $or: [{ subject: { $regex: searchText, $options: 'i' } }, { from: { $regex: searchText, $options: 'i' } }] }),
                ...(dateRange &&
                    getDateRange(dateRange) && {
                        updatedAt: { $gte: getDateRange(dateRange).startDate, $lte: getDateRange(dateRange).endDate },
                    }),
            };
            const folders = await FolderRepository.getAllFolders(
                filterQuery,
                size,
                page,
                FOLDER_LIST_DB_FIELD_MAPPING.LIST.projection,
                FOLDER_LIST_DB_FIELD_MAPPING.SORT.sort,
            );
            const total = await FolderRepository.countDocuments(filterQuery);
            return { data: folders, size: folders.length, page: 1, total };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in FolderService.getAllFolders: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async getFolder(folderId: string): Promise<FolderDocument> {
        try {
            const folder = await FolderRepository.getFolder(folderId);
            if (!folder) {
                throw new Error('Folder not found');
            }
            return folder;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in FolderService.getFolder: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async getAccountFolders(accountId: string): Promise<PaginatedDataResponse<FolderDocument>> {
        try {
            const account = await AccountRepository.getAccountById(accountId, { provider: 1 });
            if (!account) {
                throw new Error('Account not found');
            }
            const folders = await FolderRepository.getAccountFolders(accountId);
            return { data: folders, size: folders.length, page: 1, total: folders.length };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in FolderService.getAccountFolders: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async createFolder(accountId: string, folderName: string): Promise<UpdateAPIResponse> {
        try {
            const account = await AccountRepository.getAccountById(accountId, { provider: 1, userId: 1 });
            if (!account) {
                throw new Error('Account not found');
            }
            const provider = EmailProviderFactory.getProvider(account.provider as ACCOUNT_PROVIDER);
            return provider.createFolder(account.userId, accountId, folderName);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in FolderService.createFolder: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async updateFolder(accountId: string, folderId: string, folderName: string): Promise<UpdateAPIResponse> {
        try {
            const account = await AccountRepository.getAccountById(accountId, { provider: 1, userId: 1 });
            if (!account) {
                throw new Error('Account not found');
            }
            const provider = EmailProviderFactory.getProvider(account.provider as ACCOUNT_PROVIDER);
            return provider.updateFolder(accountId, folderId, folderName);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in FolderService.updateFolder: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async deleteFolder(folderId: string): Promise<UpdateAPIResponse> {
        try {
            const folder = await FolderRepository.getFolderByProviderFolderId(folderId);
            if (!folder) {
                throw new Error('Folder not found');
            }
            const account = await AccountRepository.getAccountById(folder.accountId);
            if (!account) {
                throw new Error('Account not found');
            }
            const provider = EmailProviderFactory.getProvider(account.provider as ACCOUNT_PROVIDER);
            return provider.deleteFolder(folder.accountId, folderId);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in FolderService.deleteFolder: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
