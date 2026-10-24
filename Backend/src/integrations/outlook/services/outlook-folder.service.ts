import { LOGGER_MODULE } from '@constants';
import { UpdateAPIResponse } from '@mailsense/types';
import { FolderDocument, FolderInput } from '@modules/folders/folder.model.js';
import { FolderRepository } from '@modules/folders/folder.repository.js';
import { createLogger } from '@observability';
import { OutlookClient } from '../clients/index.js';
import { OutlookFolderObject } from '../outlook.types.js';
import * as OutlookUtils from '../outlook.utils.js';

const logger = createLogger(LOGGER_MODULE.OUTLOOK_SERVICE);

export class OutlookFolderService {
    async getAllFolders(accountId: string, userId: string): Promise<Partial<FolderInput>[]> {
        try {
            const folders = await OutlookClient.getAllFolders(accountId);
            const folderInputs: Partial<FolderInput>[] = folders.value.map((folder) =>
                OutlookUtils.parseOutlookFolderObject(accountId, userId, folder),
            );
            return folderInputs;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.getAllFolders: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async getFolderDetails(accountId: string, folderId: string): Promise<OutlookFolderObject> {
        try {
            const folder = await OutlookClient.getFolderDetails(accountId, folderId);
            return folder;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.getFolderDetails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async createFolder(userId: string, accountId: string, folderName: string, isHidden: boolean): Promise<UpdateAPIResponse> {
        try {
            const folder = await OutlookClient.createFolder(accountId, folderName, isHidden);
            const folderBody = OutlookUtils.parseOutlookFolderObject(accountId, userId, folder);
            await FolderRepository.createFolder(folderBody);
            return { status: true, message: 'Folder created successfully' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.createFolder: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async updateFolder(accountId: string, folderId: string, folderName: string): Promise<UpdateAPIResponse> {
        try {
            await OutlookClient.updateFolder(accountId, folderId, folderName);
            const folderBody: Partial<FolderDocument> = {
                name: folderName,
                normalizedName: folderName.toLowerCase().trim(),
            };
            await FolderRepository.updateFolderByProviderFolderId(folderId, folderBody);
            return { status: true, message: 'Folder updated successfully' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.updateFolder: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async deleteFolder(accountId: string, folderId: string): Promise<UpdateAPIResponse> {
        try {
            await OutlookClient.deleteFolder(accountId, folderId);
            await FolderRepository.deleteFolderByProviderFolderId(folderId);
            return { status: true, message: 'Folder deleted successfully' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.deleteFolder: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
