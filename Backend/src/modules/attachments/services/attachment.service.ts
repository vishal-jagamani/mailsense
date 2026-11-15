import mongoose from 'mongoose';

import { LOGGER_MODULE } from '@constants';
import { ForbiddenError, NotFoundError } from '@errors';
import { ObjectStorageService } from '@integrations/storage/ObjectStorageService.service.js';
import { ATTACHMENT_STATUS, StagedAttachmentAttributes } from '@mailsense/types';
import { AccountRepository } from '@modules/accounts/database/index.js';
import { createLogger } from '@observability';
import { StagedAttachmentInput, StagedAttachmentRepository } from '../database/index.js';
import { UploadStageAttachmentFile } from '../types/index.js';

const logger = createLogger(LOGGER_MODULE.ATTACHMENT_SERVICE);

export class AttachmentsService {
    private objectStorageService: ObjectStorageService;

    constructor() {
        this.objectStorageService = new ObjectStorageService();
    }

    async uploadStagedAttachment(userId: string, accountId: string, file: UploadStageAttachmentFile): Promise<StagedAttachmentAttributes> {
        try {
            const account = await AccountRepository.getAccountById(accountId, { userId: 1 });
            if (!account) {
                throw new NotFoundError('Account', accountId);
            }
            if (account.userId !== userId) {
                throw new ForbiddenError('Unauthorized attempt to stage attachment for unowned account');
            }

            const attachmentId = new mongoose.Types.ObjectId().toString();
            const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
            const r2Key = `staged/${userId}/${attachmentId}-${sanitizedFilename}`;
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours TTL

            const data: Partial<StagedAttachmentInput> = {
                userId,
                accountId,
                r2Key,
                filename: sanitizedFilename,
                mimeType: file.mimetype,
                size: file.size,
                status: ATTACHMENT_STATUS.STAGED,
                expiresAt,
            };
            const stagedAttachment = await StagedAttachmentRepository.createStagedAttachment(data);

            await this.objectStorageService.uploadObject(r2Key, file.buffer, file.mimetype);

            // await StagedAttachmentRepository.updateStagedAttachment(stagedAttachment._id, { r2Key });

            return stagedAttachment;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AttachmentService.uploadStagedAttachment: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async getStagedAttachmentWithStream(attachmentId: string) {
        try {
            const stagedAttachment = await StagedAttachmentRepository.getStagedAttachmentById(attachmentId);

            if (!stagedAttachment) {
                throw new NotFoundError('Attachment', attachmentId);
            }
            const { stream } = await this.objectStorageService.getObjectStream(stagedAttachment.r2Key);
            return { stagedAttachment, stream };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AttachmentService.getStagedAttachmentWithStream: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async deleteStagedAttachment(userId: string, attachmentId: string) {
        try {
            const stagedAttachment = await StagedAttachmentRepository.getStagedAttachmentById(attachmentId);
            if (!stagedAttachment) {
                throw new NotFoundError('Attachment', attachmentId);
            }
            if (stagedAttachment.userId.toString() !== userId.toString()) {
                throw new ForbiddenError('Unauthorized to delete attachment');
            }
            await this.objectStorageService.deleteObject(stagedAttachment.r2Key);
            await StagedAttachmentRepository.deleteStagedAttachments([attachmentId]);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AttachmentService.deleteStagedAttachment: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async cleanupStagedAttachments(attachmentIds: string[]): Promise<void> {
        try {
            const stagedAttachments = await StagedAttachmentRepository.getStagedAttachmentsByIds(attachmentIds);

            for (const item of stagedAttachments) {
                await this.objectStorageService.deleteObject(item.r2Key).catch(() => null);
            }
            await StagedAttachmentRepository.deleteStagedAttachments(attachmentIds);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AttachmentService.cleanupStagedAttachments: ${errorMessage}`, { error: err });
            return;
        }
    }
}
