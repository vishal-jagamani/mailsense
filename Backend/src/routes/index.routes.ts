import accountsRoutes from '@modules/accounts/account.routes.js';
import demoRoutes from '@modules/demo/demo.routes.js';
import emailsRoutes from '@modules/emails/email.routes.js';
import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
    res.send('MailSense Backend!');
});

router.use('/demo', demoRoutes);

router.use('/accounts', accountsRoutes);

router.use('/emails', emailsRoutes);

export default router;
