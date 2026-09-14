import { HEALTH_STATUS, LOGGER_MODULE } from '@constants';
import { createLogger } from '@observability';
import { Request, Response } from 'express';
import { HealthService } from './health.service.js';

export class HealthController {
    private static readonly logger = createLogger(LOGGER_MODULE.HEALTH_CONTROLLER);

    public static getLiveness(_req: Request, res: Response): void {
        try {
            const liveness = HealthService.getLiveness();
            const httpStatus = liveness.status === HEALTH_STATUS.HEALTHY ? 200 : 503;
            res.status(httpStatus).json(liveness);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            HealthController.logger.error(`Failed to handle liveness probe: ${msg}`, { error });
            res.status(503).json({
                status: HEALTH_STATUS.UNHEALTHY,
                uptime: 0,
                timestamp: new Date().toISOString(),
            });
        }
    }

    public static async getReadiness(_req: Request, res: Response): Promise<void> {
        try {
            const readiness = await HealthService.getReadiness();
            const httpStatus = readiness.status === HEALTH_STATUS.HEALTHY ? 200 : 503;
            res.status(httpStatus).json(readiness);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            HealthController.logger.error(`Failed to handle readiness probe: ${msg}`, { error });
            res.status(503).json({
                status: HEALTH_STATUS.UNHEALTHY,
                checks: { mongodb: 'down', redis: 'down' },
                timestamp: new Date().toISOString(),
            });
        }
    }
}
