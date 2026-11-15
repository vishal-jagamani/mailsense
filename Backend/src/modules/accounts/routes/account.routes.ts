import { Router } from 'express';

import { authMiddleware, validate } from '@middlewares';
import { authRateLimiter, syncRateLimiter } from '@security';
import { handleRequest } from '@utils';
import { accountsMutationController, accountsQueryController } from '../controllers/index.js';
import {
    connectAccountSchema,
    deleteAccountSchema,
    enableAccountSchema,
    getAccountDetailsSchema,
    updateAccountSettingsSchema,
} from '../schema/index.js';

const router = Router();

router.get('/callback/:provider', validate({ params: connectAccountSchema }), handleRequest(accountsMutationController.callback));

router.use(authMiddleware);

router.get('/sync-all', syncRateLimiter, handleRequest(accountsMutationController.syncAccounts));

router.get('/sync/:accountId', syncRateLimiter, handleRequest(accountsMutationController.syncAccount));

router.get('/:accountId', validate({ params: getAccountDetailsSchema }), handleRequest(accountsQueryController.getAccountDetails));

router.delete('/:accountId', validate({ params: deleteAccountSchema }), handleRequest(accountsMutationController.deleteAccount));

router.get('/list/all', handleRequest(accountsQueryController.getAccounts));

router.get('/providers/list', handleRequest(accountsQueryController.getAccountProviders));

router.get('/connect/:provider', authRateLimiter, validate({ params: connectAccountSchema }), handleRequest(accountsQueryController.connect));

router.patch(
    '/enable/:accountId',
    validate({ params: getAccountDetailsSchema, body: enableAccountSchema }),
    handleRequest(accountsMutationController.enableAccount),
);

router.patch(
    '/settings/:accountId',
    validate({ params: getAccountDetailsSchema, body: updateAccountSettingsSchema }),
    handleRequest(accountsMutationController.updateAccountSettings),
);

export default router;
