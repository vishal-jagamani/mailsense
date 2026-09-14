import { Router } from 'express';
import { HealthController } from './health.controller.js';

const router = Router();

router.get('/health', HealthController.getLiveness);

router.get('/health/ready', HealthController.getReadiness);

export const healthRoutes = router;
