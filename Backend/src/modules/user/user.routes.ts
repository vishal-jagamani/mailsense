import { validate } from '@middlewares/validator.js';
import { Router } from 'express';
import { changePasswordSchema, getUserSchema, updateUserSchema } from './user.schema.js';
import { handleRequest } from '@utils/request.handler.js';
import { UserController } from './user.controller.js';

const router = Router();

const userController = new UserController();

router.get('/:id', validate(getUserSchema, 'params'), handleRequest(userController.getUser));

router.put('/:id', validate(updateUserSchema, 'body'), handleRequest(userController.updateUser));

router.get('/:id/profile', validate(getUserSchema, 'params'), handleRequest(userController.getUserProfile));

router.put('/:id/profile', validate(updateUserSchema, 'body'), handleRequest(userController.updateUserProfile));

router.patch('/:id/change-password', validate(changePasswordSchema, 'body'), handleRequest(userController.changePassword));

export default router;
