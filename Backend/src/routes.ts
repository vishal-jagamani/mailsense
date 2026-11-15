import { Router } from 'express';

import accountsRoutes from '@modules/accounts/routes/index.js';
import analyticsRoutes from '@modules/analytics/routes/index.js';
import attachmentRoutes from '@modules/attachments/routes/index.js';
import draftRoutes from '@modules/drafts/routes/index.js';
import emailsRoutes from '@modules/emails/routes/index.js';
import foldersRoutes from '@modules/folders/routes/index.js';
import usersRoutes from '@modules/user/routes/index.js';

const router = Router();

router.get('/', (req, res) => {
    res.send('MailSense Backend!');
});

router.use('/users', usersRoutes);

router.use('/accounts', accountsRoutes);

router.use('/emails', emailsRoutes);

router.use('/folders', foldersRoutes);

router.use('/attachments', attachmentRoutes);

router.use('/drafts', draftRoutes);

router.use('/analytics', analyticsRoutes);

export default router;
