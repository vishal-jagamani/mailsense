import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
    res.send('MailSense Backend!');
});

export default router;
