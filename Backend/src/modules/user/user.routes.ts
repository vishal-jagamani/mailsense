import { validate } from '@middlewares/validator.js';
import { Router } from 'express';
import { changePasswordSchema, getUserSchema, updateUserSchema } from './user.schema.js';
import { handleRequest } from '@utils/request.handler.js';
import { UserController } from './user.controller.js';

const router = Router();

const userController = new UserController();

router.get('/:id', validate({ params: getUserSchema }), handleRequest(userController.getUser));

router.put('/:id', validate({ body: updateUserSchema }), handleRequest(userController.updateUser));

router.get('/:id/profile', validate({ params: getUserSchema }), handleRequest(userController.getUserProfile));

router.put('/:id/profile', validate({ body: updateUserSchema }), handleRequest(userController.updateUserProfile));

router.patch('/:id/change-password', validate({ body: changePasswordSchema }), handleRequest(userController.changePassword));

export default router;
