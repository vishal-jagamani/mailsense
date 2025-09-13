import { Router } from 'express';
import accountsRoutes from '@modules/accounts/account.routes.js';
import demoRoutes from '@modules/demo/demo.routes.js';

const router = Router();

router.get('/', (req, res) => {
    res.send('MailSense Backend!');
});

router.use('/demo', demoRoutes);

router.use('/accounts', accountsRoutes);

export default router;
