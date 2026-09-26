import { BadRequestError, UnauthorizedError } from '@errors';
import { NextFunction, Request, Response } from 'express';
import { DeleteStagedAttachmentSchema, UploadStagedAttachmentSchema } from './attachment.schema.js';
import { AttachmentsService } from './attachment.service.js';

export class AttachmentsController {
    private attachmentsService: AttachmentsService;

    constructor() {
        this.attachmentsService = new AttachmentsService();
    }

    public uploadStagedAttachment = async (
        req: Request<object, object, UploadStagedAttachmentSchema, object>,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError('User ID is required');
            }
            const { accountId } = req.body;
            if (!accountId) {
                throw new BadRequestError('Account ID is required');
            }
            const file = req.file;
            if (!file) {
                throw new BadRequestError('File is required');
            }
            const uploadStagedAttachment = await this.attachmentsService.uploadStagedAttachment(userId, accountId, file);
            res.status(201).send({
                success: true,
                attachment: {
                    attachmentId: String(uploadStagedAttachment._id),
                    filename: uploadStagedAttachment.filename,
                    mimeType: uploadStagedAttachment.mimeType,
                    size: uploadStagedAttachment.size,
                    createdAt: uploadStagedAttachment.createdAt,
                },
            });
        } catch (err) {
            next(err);
        }
    };

    public deleteStagedAttachment = async (
        req: Request<DeleteStagedAttachmentSchema, object, object, object>,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError('User ID is required');
            }
            const { attachmentId } = req.params;
            if (!attachmentId) {
                throw new BadRequestError('Attachment ID is required');
            }
            await this.attachmentsService.deleteStagedAttachment(userId, attachmentId);
            res.status(200).send({ success: true, message: 'Staged attachment deleted successfully' });
        } catch (err) {
            next(err);
        }
    };
}
