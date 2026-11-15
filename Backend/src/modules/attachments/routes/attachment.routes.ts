import { BadRequestError } from '@errors';
import { authMiddleware, validate } from '@middlewares';
import { handleRequest } from '@utils';
import { Router } from 'express';
import multer from 'multer';
import { attachmentController } from '../controllers/index.js';
import { deleteStagedAttachmentSchema, uploadStagedAttachmentSchema } from '../schema/index.js';

const router = Router();

const upload = multer({
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB single file limit
    fileFilter: (_req, file, cb) => {
        try {
            const forbiddenExts = ['.exe', '.bat', '.sh', '.vbs', '.js', '.jar'];
            const isForbidden = forbiddenExts.some((ext) => file.originalname.toLowerCase().endsWith(ext));
            if (isForbidden) {
                return cb(new BadRequestError('File extension forbidden for security'));
            }
            cb(null, true);
        } catch (error) {
            cb(error instanceof Error ? error : new Error(String(error)));
        }
    },
});

router.use(authMiddleware);

router.post(
    '/upload',
    upload.single('file'),
    validate({ body: uploadStagedAttachmentSchema }),
    handleRequest(attachmentController.uploadStagedAttachment),
);

router.delete('/:attachmentId', validate({ params: deleteStagedAttachmentSchema }), handleRequest(attachmentController.deleteStagedAttachment));

export default router;
