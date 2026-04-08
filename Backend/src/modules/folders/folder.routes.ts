import { authMiddleware } from '@middlewares/auth.js';
import { validate } from '@middlewares/validator.js';
import { handleRequest } from '@utils/request.handler.js';
import { Router } from 'express';
import { FolderController } from './folder.controller.js';
import {
    createFolderSchema,
    getAccountFoldersSchema,
    getAllFoldersSchema,
    updateFolderBodySchema,
    updateFolderParamsSchema,
} from './folder.schema.js';

const router = Router();

const folderController = new FolderController();

router.use(authMiddleware);

router.get('/sync/:accountId', handleRequest(folderController.syncFolders));

router.post('/', validate({ body: createFolderSchema }), handleRequest(folderController.createFolder));

router.patch(
    '/:folderId',
    validate({ params: updateFolderParamsSchema, body: updateFolderBodySchema }),
    handleRequest(folderController.updateFolder),
);

router.delete('/:folderId', validate({ params: updateFolderParamsSchema }), handleRequest(folderController.deleteFolder));

router.post('/list', validate({ body: getAllFoldersSchema }), handleRequest(folderController.getAllFolders));

router.get('/list/:accountId', validate({ params: getAccountFoldersSchema }), handleRequest(folderController.getAccountFolders));

export default router;
