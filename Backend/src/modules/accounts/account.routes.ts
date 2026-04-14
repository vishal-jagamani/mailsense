import { authMiddleware } from '@middlewares/auth.js';
import { validate } from '@middlewares/validator.js';
import { handleRequest } from '@utils/request.handler.js';
import { Router } from 'express';
import { AccountsController } from './account.controller.js';
import { connectAccountSchema, deleteAccountSchema, getAccountDetailsSchema } from './account.schema.js';

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


export default router;
