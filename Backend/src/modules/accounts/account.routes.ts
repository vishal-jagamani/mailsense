import { validate } from '@middlewares/validator.js';
import { handleRequest } from '@utils/request.handler.js';
import { Router } from 'express';
import { AccountsController } from './account.controller.js';
import { connectAccountSchema, deleteAccountSchema, getAccountDetailsSchema, getAccountsSchema } from './account.schema.js';

const router = Router();

const accountsController = new AccountsController();

router.get('/sync-all', validate({ query: getAccountsSchema }), handleRequest(accountsController.syncAccounts));

router.get('/sync/:accountId', handleRequest(accountsController.syncAccount));

router.get('/:accountId', validate({ params: getAccountDetailsSchema }), handleRequest(accountsController.getAccountDetails));

router.delete('/:accountId', validate({ params: deleteAccountSchema }), handleRequest(accountsController.deleteAccount));

router.get('/list/:userId', validate({ params: getAccountsSchema }), handleRequest(accountsController.getAccounts));

router.get('/providers/list', handleRequest(accountsController.getAccountProviders));

router.get('/connect/:provider', validate({ params: connectAccountSchema }), handleRequest(accountsController.connect));

router.get('/callback/:provider', validate({ params: connectAccountSchema }), handleRequest(accountsController.callback));

export default router;
