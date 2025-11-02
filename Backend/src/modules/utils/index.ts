import { GmailApi } from '@providers/gmail/gmail.api.js';
import { decrypt } from '@utils/crypto.js';
import { Router } from 'express';

const router = Router();

router.post('/decrypt', (req, res) => {
    const { data } = req.body;
    const decryptedData = decrypt(data);
    res.send(decryptedData);
});

router.get('/getAccountAccessToken', async (req, res) => {
    const { accountId } = req.query;
    const accessToken = await GmailApi.fetchAccessToken(String(accountId));
    res.send(accessToken);
});

export default router;
