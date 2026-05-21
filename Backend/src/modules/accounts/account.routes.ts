import { Router } from 'express';

import { authMiddleware } from '@middlewares/auth.js';
import { validate } from '@middlewares/validator.js';
import { handleRequest } from '@utils';
import { AccountsController } from './account.controller.js';
import { connectAccountSchema, deleteAccountSchema, enableAccountSchema, getAccountDetailsSchema } from './account.schema.js';

const router = Router();

const accountsController = new AccountsController();

router.get('/callback/:provider', validate({ params: connectAccountSchema }), handleRequest(accountsController.callback));

router.use(authMiddleware);

router.get('/sync-all', handleRequest(accountsController.syncAccounts));

router.get('/sync/:accountId', handleRequest(accountsController.syncAccount));

router.get('/:accountId', validate({ params: getAccountDetailsSchema }), handleRequest(accountsController.getAccountDetails));

router.delete('/:accountId', validate({ params: deleteAccountSchema }), handleRequest(accountsController.deleteAccount));

router.get('/list/all', handleRequest(accountsController.getAccounts));

router.get('/providers/list', handleRequest(accountsController.getAccountProviders));

router.get('/connect/:provider', validate({ params: connectAccountSchema }), handleRequest(accountsController.connect));

router.patch(
    '/enable/:accountId',
    validate({ params: getAccountDetailsSchema, body: enableAccountSchema }),
    handleRequest(accountsController.enableAccount),
);

export default router;
