import { validate } from '@middlewares';
import { clientErrorRateLimiter } from '@security';
import { handleRequest } from '@utils';
import { Router } from 'express';
import { observabilityController } from '../controllers/index.js';
import { reportClientErrorSchema } from '../schemas/index.js';

const router = Router();

router.post(
    '/client-errors',
    clientErrorRateLimiter,
    validate({ body: reportClientErrorSchema }),
    handleRequest(observabilityController.reportClientError),
);

export default router;
