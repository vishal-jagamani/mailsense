import { handleRequest } from '@utils/request.handler.js';
import { Router } from 'express';
import { EmailController } from './email.controller.js';
import { validate } from '@middlewares/validator.js';
import { getEmailsSchema } from './email.schema.js';
import { authMiddleware } from '@middlewares/auth.js';

const router = Router();

const emailController = new EmailController();

router.use(authMiddleware);

router.get('/:accountId', validate(getEmailsSchema, 'query'), handleRequest(emailController.getEmails));

export default router;
