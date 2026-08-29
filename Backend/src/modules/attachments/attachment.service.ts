import { StagedAttachmentAttributes } from '@mailsense/types';
import { logger } from '@utils';
import { ObjectStorageService } from '../../integrations/storage/ObjectStorageService.service.js';
import { StagedAttachmentInput } from './attachment.model.js';
import { StagedAttachmentRepository } from './attachment.repository.js';
import { UploadStageAttachmentFile } from './attachment.types.js';
import mongoose from 'mongoose';

export class AttachmentsService {
    private objectStorageService: ObjectStorageService;

    constructor() {
        this.objectStorageService = new ObjectStorageService();
    }

    async uploadStagedAttachment(userId: string, accountId: string, file: UploadStageAttachmentFile): Promise<StagedAttachmentAttributes> {
        try {
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
                status: 'STAGED',
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
                throw new Error(`Staged attachment ${attachmentId} not found or unauthorized`);
            }
            const { stream } = await this.objectStorageService.getObjectStream(stagedAttachment.r2Key);
            return { stagedAttachment, stream };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AttachmentService.getStagedAttachmentWithStream: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async deleteStagedAttachment(attachmentId: string) {
        try {
            const stagedAttachment = await StagedAttachmentRepository.getStagedAttachmentById(attachmentId);
            if (!stagedAttachment) {
                throw new Error(`Staged attachment ${attachmentId} not found or unauthorized`);
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
