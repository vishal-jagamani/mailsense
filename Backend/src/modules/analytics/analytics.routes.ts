import { authMiddleware, validate } from '@middlewares';
import { Router } from 'express';
import { handleRequest } from 'shared/utils/index.js';
import { AnalyticsController } from './analytics.controller.js';
import { analyticsQuerySchema } from './analytics.schema.js';

const router = Router();
const analyticsController = new AnalyticsController();

router.use(authMiddleware);

router.get('/dashboard', validate({ query: analyticsQuerySchema }), handleRequest(analyticsController.getDashboard));

export default router;
