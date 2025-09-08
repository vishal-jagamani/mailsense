import { Router } from 'express';
import { validate } from '../../middlewares/validator';
import { handleRequest } from '../../utils/request.handler';
import { DemoController } from './demo.controller';
import { catFactQuerySchema } from './demo.schema';

const router = Router();
const demoController = new DemoController();

router.get('/catFact', validate(catFactQuerySchema, 'query'), handleRequest(demoController.getCatFact));

export default router;
