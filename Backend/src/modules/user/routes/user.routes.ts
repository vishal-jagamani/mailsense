import { Router } from 'express';

import { authMiddleware, validate } from '@middlewares';
import { handleRequest } from '@utils';
import { userController } from '../controllers/index.js';
import { changePasswordSchema, updateUserSchema, updateUserSettingsSchema } from '../schema/index.js';

const router = Router();

router.use(authMiddleware);

router.get('/', handleRequest(userController.getUser));

router.put('/', validate({ body: updateUserSchema }), handleRequest(userController.updateUser));

router.get('/profile', handleRequest(userController.getUserProfile));

router.put('/profile', validate({ body: updateUserSchema }), handleRequest(userController.updateUserProfile));

router.patch('/change-password', validate({ body: changePasswordSchema }), handleRequest(userController.changePassword));

router.get('/settings', handleRequest(userController.getUserSettings));

router.patch('/settings', validate({ body: updateUserSettingsSchema }), handleRequest(userController.updateUserSettings));

export default router;
