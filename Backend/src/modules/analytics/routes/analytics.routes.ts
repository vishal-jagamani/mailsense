import { authMiddleware, validate } from '@middlewares';
import { handleRequest } from '@utils';
import { Router } from 'express';
import { analyticsController } from '../controllers/index.js';
import { analyticsQuerySchema } from '../schema/index.js';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard', validate({ query: analyticsQuerySchema }), handleRequest(analyticsController.getDashboard));

export default router;
