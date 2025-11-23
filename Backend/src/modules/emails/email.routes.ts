import { handleRequest } from '@utils/request.handler.js';
import { Router } from 'express';
import { EmailController } from './email.controller.js';
import { validate } from '@middlewares/validator.js';
import { archiveEmailSchema, deleteEmailSchema, getAllEmailsSchema, getEmailSchema, getEmailsSchema } from './email.schema.js';
import { authMiddleware } from '@middlewares/auth.js';

const router = Router();

const emailController = new EmailController();

router.use(authMiddleware);

router.get('/list-all', validate({ headers: getAllEmailsSchema }), handleRequest(emailController.getAllEmails));

router.get('/list/:accountId', handleRequest(emailController.getEmails));

router.get('/details/:emailId', validate({ params: getEmailSchema }), handleRequest(emailController.getEmail));

router.delete('/', validate({ body: deleteEmailSchema }), handleRequest(emailController.deleteEmail));

router.post('/archive', validate({ body: archiveEmailSchema }), handleRequest(emailController.archiveEmails));

export default router;
