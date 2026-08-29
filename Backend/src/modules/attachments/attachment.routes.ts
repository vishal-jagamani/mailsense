import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../../middlewares/auth.js';
import { handleRequest } from '@utils';
import { AttachmentsController } from './attachment.controller.js';

const router = Router();
const attachmentController = new AttachmentsController();

const upload = multer({
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB single file limit
    fileFilter: (req, file, cb) => {
        const forbiddenExts = ['.exe', '.bat', '.sh', '.vbs', '.js', '.jar'];
        const isForbidden = forbiddenExts.some((ext) => file.originalname.toLowerCase().endsWith(ext));
        if (isForbidden) {
            return cb(new Error('File extension forbidden for security'));
        }
        cb(null, true);
    },
});

router.use(authMiddleware);

router.post('/upload', upload.single('file'), handleRequest(attachmentController.uploadStagedAttachment));
router.delete('/:attachmentId', handleRequest(attachmentController.deleteStagedAttachment));

export default router;
