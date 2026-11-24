import { authMiddleware, validate } from '@middlewares';
import { handleRequest } from '@utils';
import { Router } from 'express';
import { AI_ROUTES } from '../constants/ai.constants.js';
import { aiController } from '../controllers/index.js';
import { getEmailSummaryParamsSchema, getSuggestedRepliesParamsSchema } from '../schema/ai.schema.js';

const router = Router();

router.use(authMiddleware);

router.get(AI_ROUTES.THREAD_SUMMARY, validate({ params: getEmailSummaryParamsSchema }), handleRequest(aiController.summarizeThread));

router.get(AI_ROUTES.SUGGESTED_REPLIES, validate({ params: getSuggestedRepliesParamsSchema }), handleRequest(aiController.getSuggestedReplies));

export default router;
