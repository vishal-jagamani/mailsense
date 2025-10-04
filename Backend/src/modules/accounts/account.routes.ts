import { validate } from '@middlewares/validator.js';
import { handleRequest } from '@utils/request.handler.js';
import { Router } from 'express';
import { AccountsController } from './account.controller.js';
import { connectAccountSchema, getAccountSchema } from './account.schema.js';

const router = Router();

const accountsController = new AccountsController();

router.delete('/:accountId', validate(getAccountSchema, 'params'), handleRequest(accountsController.deleteAccount));

router.get('/list/:userId', validate(getAccountSchema, 'params'), handleRequest(accountsController.getAccounts));

router.get('/providers', handleRequest(accountsController.getAccountProviders));

router.get('/connect/:provider', validate(connectAccountSchema, 'params'), handleRequest(accountsController.connect));

router.get('/callback/:provider', validate(connectAccountSchema, 'params'), handleRequest(accountsController.callback));

router.get('/emails/:accountId', handleRequest(accountsController.fetchEmails));

router.get('/sync', handleRequest(accountsController.syncAccounts));

router.get('/sync/:accountId', handleRequest(accountsController.syncAccount));

export default router;
