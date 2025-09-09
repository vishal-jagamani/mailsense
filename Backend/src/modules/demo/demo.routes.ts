import { Router } from 'express';
import { validate } from '../../middlewares/validator.js';
import { handleRequest } from '../../utils/request.handler.js';
import { DemoController } from './demo.controller.js';
import { catFactQuerySchema } from './demo.schema.js';

const router = Router();
const demoController = new DemoController();

router.get('/catFact', validate(catFactQuerySchema, 'query'), handleRequest(demoController.getCatFact));

export default router;
