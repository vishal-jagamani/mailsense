import { authMiddleware, validate } from '@middlewares';
import { Router } from 'express';
import { handleRequest } from 'shared/utils/index.js';
import { DraftController } from './draft.controller.js';
import { draftParamSchema, saveDraftSchema } from './draft.schema.js';

const router = Router();
const draftController = new DraftController();

router.use(authMiddleware);

router.get('/', handleRequest(draftController.getUserDrafts));

router.post('/save', validate({ body: saveDraftSchema }), handleRequest(draftController.saveDraft));

router.get('/:draftId', validate({ params: draftParamSchema }), handleRequest(draftController.getDraftById));

router.delete('/:draftId', validate({ params: draftParamSchema }), handleRequest(draftController.deleteDraft));

router.post('/:draftId/send', validate({ params: draftParamSchema }), handleRequest(draftController.sendDraft));

export default router;
