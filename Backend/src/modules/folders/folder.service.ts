import { AccountRepository } from '@modules/accounts/account.repository.js';
import { GmailService } from '@providers/gmail/gmail.service.js';
import { OutlookService } from '@providers/outlook/outlook.service.js';
import { logger } from '@utils/logger.js';
import { AccountProvider } from 'types/account.types.js';
import { PaginatedDataResponse, UpdateAPIResponse } from 'types/api.types.js';
import { FolderDocument } from './folder.model.js';
import { FolderRepository } from './folder.repository.js';

export class FolderService {
    private gmailService: GmailService;
    private outlookService: OutlookService;

    constructor() {
        this.gmailService = new GmailService();
        this.outlookService = new OutlookService();
    }

    public async syncFolders(accountId: string): Promise<UpdateAPIResponse> {
        try {
            const account = await AccountRepository.getAccountById(accountId, { provider: 1, userId: 1 });
            if (!account) {
                throw new Error('Account not found');
            }
            if (account.provider === AccountProvider.GMAIL) {
                const result = await this.syncGmailLabels(accountId, account.userId);
                return result;
            } else if (account.provider === AccountProvider.OUTLOOK) {
                const result = await this.syncOutlookFolders(accountId, account.userId);
                return result;
            }
            return { status: false, message: 'Invalid provider' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in FolderService.syncFolders: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    private async syncGmailLabels(accountId: string, userId: string): Promise<UpdateAPIResponse> {
        try {
            const result = await this.gmailService.getAllLabels(accountId, userId);
            await FolderRepository.addFoldersInBulk(result);
            return { status: true, message: 'Labels synced successfully' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in FolderService.syncGmailLabels: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    private async syncOutlookFolders(accountId: string, userId: string): Promise<UpdateAPIResponse> {
        try {
            const result = await this.outlookService.getAllFolders(accountId, userId);
            await FolderRepository.addFoldersInBulk(result);
            return { status: true, message: 'Folders synced successfully' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in FolderService.syncOutlookFolders: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async getAllFolders(userId: string): Promise<PaginatedDataResponse<FolderDocument[]>> {
        try {
            const folders = await FolderRepository.getAllFolders(userId);
            return { data: folders, size: folders.length, page: 1, total: folders.length };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in FolderService.getAllFolders: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async getAccountFolders(accountId: string): Promise<PaginatedDataResponse<FolderDocument[]>> {
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
            if (account.provider === AccountProvider.GMAIL) {
                const result = await this.gmailService.createLabel(account.userId, accountId, folderName);
                return result;
            } else if (account.provider === AccountProvider.OUTLOOK) {
                const result = await this.outlookService.createFolder(account.userId, accountId, folderName, false);
                return result;
            }
            return { status: false, message: 'Invalid provider' };
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
            if (account.provider === AccountProvider.GMAIL) {
                const result = await this.gmailService.updateLabel(accountId, folderId, folderName);
                return result;
            } else if (account.provider === AccountProvider.OUTLOOK) {
                const result = await this.outlookService.updateFolder(accountId, folderId, folderName);
                return result;
            }
            return { status: false, message: 'Invalid provider' };
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
            if (account.provider === AccountProvider.GMAIL) {
                const result = await this.gmailService.deleteLabel(String(account._id), folderId);
                return result;
            } else if (account.provider === AccountProvider.OUTLOOK) {
                const result = await this.outlookService.deleteFolder(String(account._id), folderId);
                return result;
            }
            return { status: false, message: 'Invalid provider' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in FolderService.deleteFolder: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
