import { authMiddleware } from '@middlewares/auth.js';
import { validate } from '@middlewares/validator.js';
import { handleRequest } from '@utils/request.handler.js';
import { Router } from 'express';
import { EmailController } from './email.controller.js';
import {
    archiveEmailSchema,
    composeEmailSchema,
    deleteEmailSchema,
    getAllEmailsSchema,
    getEmailSchema,
    searchEmailSchema,
    searchOtherContactsSchema,
    starEmailSchema,
    unreadEmailSchema,
} from './email.schema.js';

const router = Router();

const emailController = new EmailController();

router.use(authMiddleware);

router.post('/list', validate({ body: getAllEmailsSchema }), handleRequest(emailController.getAllEmails));

router.get('/list/:accountId', handleRequest(emailController.getEmails));

router.get('/details/:emailId', validate({ params: getEmailSchema }), handleRequest(emailController.getEmail));

router.post('/delete', validate({ body: deleteEmailSchema }), handleRequest(emailController.deleteEmail));

router.post('/archive', validate({ body: archiveEmailSchema }), handleRequest(emailController.archiveEmails));

router.post('/star', validate({ body: starEmailSchema }), handleRequest(emailController.starEmails));

router.post('/unread', validate({ body: unreadEmailSchema }), handleRequest(emailController.unreadEmails));

router.post('/search', validate({ body: searchEmailSchema }), handleRequest(emailController.searchEmails));

router.post('/compose', validate({ body: composeEmailSchema }), handleRequest(emailController.composeEmail));

router.post('/searchOtherContacts', validate({ body: searchOtherContactsSchema }), handleRequest(emailController.searchOtherContacts));

export default router;
