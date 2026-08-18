import { NextFunction, Request, Response } from 'express';
import { AttachmentsService } from './attachment.service.js';

export class AttachmentsController {
    private attachmentsService: AttachmentsService;

    constructor() {
        this.attachmentsService = new AttachmentsService();
    }

    public uploadStagedAttachment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) throw new Error('User ID is required');
            const { accountId } = req.body;
            if (!accountId) throw new Error('Account ID is required');
            const file = req.file;
            if (!file) throw new Error('File is required');
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
        req: Request<{ attachmentId: string }, object, object, object>,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { attachmentId } = req.params;
            if (!attachmentId) throw new Error('Attachment ID is required');
            const userId = req.user?.id;
            if (!userId) throw new Error('User ID is required');
            await this.attachmentsService.deleteStagedAttachment(attachmentId);
            res.status(200).send({ success: true, message: 'Staged attachment deleted successfully' });
        } catch (err) {
            next(err);
        }
    };
}
