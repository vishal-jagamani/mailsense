import { validate } from '@middlewares/validator.js';
import { handleRequest } from '@utils/request.handler.js';
import { Router } from 'express';
import { AccountsController } from './account.controller.js';
import { connectAccountSchema } from './account.schema.js';

const router = Router();

const accountsController = new AccountsController();

router.get('/providers', handleRequest(accountsController.getAccountProviders));

router.get('/connect/:provider', validate(connectAccountSchema, 'params'), handleRequest(accountsController.connect));

router.get('/callback/:provider', validate(connectAccountSchema, 'params'), handleRequest(accountsController.callback));

export default router;
