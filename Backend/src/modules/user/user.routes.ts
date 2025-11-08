import { validate } from '@middlewares/validator.js';
import { Router } from 'express';
import { getUserSchema, updateUserSchema } from './user.schema.js';
import { handleRequest } from '@utils/request.handler.js';
import { UserController } from './user.controller.js';

const router = Router();

const userController = new UserController();

router.get('/:id', validate(getUserSchema, 'params'), handleRequest(userController.getUser));

router.put('/:id', validate(updateUserSchema, 'body'), handleRequest(userController.updateUser));

export default router;
