import { LOGGER_MODULE } from '@constants';
import { GmailLabel, UpdateAPIResponse } from '@mailsense/types';
import { FolderDocument, FolderInput } from '@modules/folders/folder.model.js';
import { FolderRepository } from '@modules/folders/folder.repository.js';
import { createLogger } from '@observability';
import { BatchProcessor } from '@utils';
import { GmailClient } from '../clients/index.js';
import * as GmailUtils from '../gmail.utils.js';

const logger = createLogger(LOGGER_MODULE.GMAIL_SERVICE);

export class GmailLabelService {
    async getAllLabels(accountId: string, userId: string): Promise<Partial<FolderInput>[]> {
        try {
            const labels = await GmailClient.getAllLabels(accountId);
            const batchProcessor = new BatchProcessor<GmailLabel, Partial<FolderInput>>(3, 200); // Process 3 labels at a time with 200ms delay

            const folderInputs = await batchProcessor.processBatches(labels, async (item) => {
                const label = await GmailClient.getLabelDetails(accountId, item.id);
                return GmailUtils.parseGmailLabelObject(accountId, userId, label);
            });

            return folderInputs;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailService.getAllLabels: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async getLabelDetails(accountId: string, labelId: string): Promise<GmailLabel> {
        try {
            const label = await GmailClient.getLabelDetails(accountId, labelId);
            return label;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailService.getLabelDetails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async createLabel(userId: string, accountId: string, labelName: string): Promise<UpdateAPIResponse> {
        try {
            const label = await GmailClient.createLabel(accountId, labelName);
            const createdLabel = await GmailClient.getLabelDetails(accountId, label.id);
            const folderObject = GmailUtils.parseGmailLabelObject(accountId, userId, createdLabel);
            await FolderRepository.createFolder(folderObject);
            return { status: true, message: 'Label created successfully' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailService.createLabel: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async updateLabel(accountId: string, labelId: string, labelName: string): Promise<UpdateAPIResponse> {
        try {
            await GmailClient.updateLabel(accountId, labelId, labelName);
            const folderBody: Partial<FolderDocument> = {
                name: labelName,
                normalizedName: labelName.toLowerCase().trim(),
            };
            await FolderRepository.updateFolderByProviderFolderId(labelId, folderBody);
            return { status: true, message: 'Label updated successfully' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailService.updateLabel: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async deleteLabel(accountId: string, labelId: string): Promise<UpdateAPIResponse> {
        try {
            await GmailClient.deleteLabel(accountId, labelId);
            await FolderRepository.deleteFolderByProviderFolderId(labelId);
            return { status: true, message: 'Label deleted successfully' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailService.deleteLabel: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
