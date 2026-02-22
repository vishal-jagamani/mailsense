import accountsRoutes from '@modules/accounts/account.routes.js';
import demoRoutes from '@modules/demo/demo.routes.js';
import emailsRoutes from '@modules/emails/email.routes.js';
import usersRoutes from '@modules/user/user.routes.js';
import utilsRoutes from '@modules/utils/index.js';

import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
    res.send('MailSense Backend!');
});

router.use('/demo', demoRoutes);

router.use('/users', usersRoutes);

router.use('/accounts', accountsRoutes);

router.use('/emails', emailsRoutes);

router.use('/utils', utilsRoutes);

export default router;
