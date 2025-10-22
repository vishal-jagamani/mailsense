import { decrypt } from '@utils/crypto.js';
import { Router } from 'express';

const router = Router();

router.post('/decrypt', (req, res) => {
    const { data } = req.body;
    const decryptedData = decrypt(data);
    res.send(decryptedData);
});

export default router;
