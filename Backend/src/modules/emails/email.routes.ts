import { handleRequest } from '@utils/request.handler.js';
import { Router } from 'express';
import { EmailController } from './email.controller.js';
import { validate } from '@middlewares/validator.js';
import { deleteEmailSchema, getEmailSchema, getEmailsSchema } from './email.schema.js';
import { authMiddleware } from '@middlewares/auth.js';

const router = Router();

const emailController = new EmailController();

router.use(authMiddleware);

router.get('/list/:accountId', validate(getEmailsSchema, 'query'), handleRequest(emailController.getEmails));

router.get('/:emailId', validate(getEmailSchema, 'params'), handleRequest(emailController.getEmail));

router.delete('/', validate(deleteEmailSchema, 'body'), handleRequest(emailController.deleteEmail));

export default router;
