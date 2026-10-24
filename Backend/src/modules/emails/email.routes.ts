import { Router } from 'express';

import { authMiddleware, validate } from '@middlewares';
import { composeRateLimiter } from '@security';
import { handleRequest } from 'shared/utils/index.js';
import { emailMutationController, emailQueryController } from './controllers/index.js';
import {
    archiveEmailSchema,
    composeEmailSchema,
    deleteEmailSchema,
    downloadAttachmentSchema,
    getAllEmailsSchema,
    getEmailSchema,
    moveEmailsSchema,
    searchEmailSchema,
    searchOtherContactsSchema,
    starEmailSchema,
    unreadEmailSchema,
} from './email.schema.js';

const router = Router();

router.use(authMiddleware);

router.post('/list', validate({ body: getAllEmailsSchema }), handleRequest(emailQueryController.getAllEmails));

router.get('/list/:accountId', handleRequest(emailQueryController.getEmails));

router.get('/filters', handleRequest(emailQueryController.getFilters));

router.get('/details/:emailId', validate({ params: getEmailSchema }), handleRequest(emailQueryController.getEmail));

router.get('/attachment/:emailId/:attachmentId', validate({ params: downloadAttachmentSchema }), handleRequest(emailQueryController.downloadAttachment));

router.post('/delete', validate({ body: deleteEmailSchema }), handleRequest(emailMutationController.deleteEmail));

router.post('/archive', validate({ body: archiveEmailSchema }), handleRequest(emailMutationController.archiveEmails));

router.post('/star', validate({ body: starEmailSchema }), handleRequest(emailMutationController.starEmails));

router.post('/unread', validate({ body: unreadEmailSchema }), handleRequest(emailMutationController.unreadEmails));

router.post('/search', validate({ body: searchEmailSchema }), handleRequest(emailQueryController.searchEmails));

router.post('/compose', composeRateLimiter, validate({ body: composeEmailSchema }), handleRequest(emailMutationController.composeEmail));

router.post('/searchOtherContacts', validate({ body: searchOtherContactsSchema }), handleRequest(emailQueryController.searchOtherContacts));

router.get('/thread/:emailId', validate({ params: getEmailSchema }), handleRequest(emailQueryController.getThread));

router.post('/move', validate({ body: moveEmailsSchema }), handleRequest(emailMutationController.moveEmails));

export default router;
