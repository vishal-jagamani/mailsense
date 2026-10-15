import { Router } from 'express';

import { GmailClient } from '@integrations/gmail/clients/index.js';
import { OutlookClient } from '@integrations/outlook/clients/index.js';
import { ACCOUNT_PROVIDER } from '@mailsense/types';
import { authMiddleware } from '@middlewares';
import { AccountRepository } from '@modules/accounts/account.repository.js';
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
    if (account.provider === ACCOUNT_PROVIDER.GMAIL) {
        accessToken = await GmailClient.fetchAccessToken(String(accountId));
    } else if (account.provider === ACCOUNT_PROVIDER.OUTLOOK) {
        accessToken = await OutlookClient.fetchAccessToken(String(accountId));
    }
    res.send({ accessToken });
});

export default router;
