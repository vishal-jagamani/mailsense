import { AccountRepository } from '@modules/accounts/account.repository.js';
import { GmailApi } from '@providers/gmail/gmail.api.js';
import { OutlookApi } from '@providers/outlook/outlook.api.js';
import { decrypt } from '@utils/crypto.js';
import { Router } from 'express';
import { AccountProvider } from 'types/account.types.js';

const router = Router();

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
