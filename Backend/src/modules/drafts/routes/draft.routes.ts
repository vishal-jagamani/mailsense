import { authMiddleware, validate } from '@middlewares';
import { handleRequest } from '@utils';
import { Router } from 'express';
import { draftController } from '../controllers/index.js';
import { draftParamSchema, saveDraftSchema } from '../schema/index.js';

const router = Router();

router.use(authMiddleware);

router.get('/', handleRequest(draftController.getUserDrafts));

router.post('/save', validate({ body: saveDraftSchema }), handleRequest(draftController.saveDraft));

router.get('/:draftId', validate({ params: draftParamSchema }), handleRequest(draftController.getDraftById));

router.delete('/:draftId', validate({ params: draftParamSchema }), handleRequest(draftController.deleteDraft));

router.post('/:draftId/send', validate({ params: draftParamSchema }), handleRequest(draftController.sendDraft));

export default router;
