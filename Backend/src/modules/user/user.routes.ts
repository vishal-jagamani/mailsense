import { Router } from 'express';

import { authMiddleware, validate } from '@middlewares';
import { handleRequest } from 'shared/utils/index.js';
import { UserController } from './user.controller.js';
import { changePasswordSchema, updateUserSchema } from './user.schema.js';

const router = Router();

const userController = new UserController();

router.use(authMiddleware);

router.get('/', handleRequest(userController.getUser));

router.put('/', validate({ body: updateUserSchema }), handleRequest(userController.updateUser));

router.get('/profile', handleRequest(userController.getUserProfile));

router.put('/profile', validate({ body: updateUserSchema }), handleRequest(userController.updateUserProfile));

router.patch('/change-password', validate({ body: changePasswordSchema }), handleRequest(userController.changePassword));

export default router;
