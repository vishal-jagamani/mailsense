import { Router } from 'express';

import { authMiddleware } from '@middlewares';
import { AccountRepository } from '@modules/accounts/account.repository.js';
import { GmailApi } from '@integrations/gmail/gmail.client.js';
import { OutlookApi } from 'integrations/outlook/outlook.api.js';
import { AccountProvider } from '@types';
import { decrypt } from 'shared/utils/index.js';

const router = Router();

router.use(authMiddleware);

router.post('/decrypt', (req, res) => {
    const { data } = req.body;
    const decryptedData = decrypt(data);
    res.send(decryptedData);
});

router.get('/getAccountAccessToken', async (req, res) => {
    const { accountId } = req.query;
    const account = await AccountRepository.getAccountById(String(accountId));
    if (!account) {
        return res.status(404).send({ error: 'Account not found' });
    }
    let accessToken;
    if (account.provider === AccountProvider.GMAIL) {
        accessToken = await GmailApi.fetchAccessToken(String(accountId));
    } else if (account.provider === AccountProvider.OUTLOOK) {
        accessToken = await OutlookApi.fetchAccessToken(String(accountId));
    }
    res.send({ accessToken });
});

export default router;
