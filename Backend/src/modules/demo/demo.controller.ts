import { NextFunction, Request, Response } from 'express';
import { createApiError } from '../../shared/utils/api.error.js';
import { DemoService } from './demo.service.js';
import { QueueService } from '../../core/queue/queue.service.js';

export class DemoController {
    private demoService: DemoService;

    constructor() {
        this.demoService = new DemoService();
    }

    getCatFact = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = req.query.id;
            if (!id) {
                throw createApiError(400, 'Bad Request', 'Invalid id', 'Please provide a valid id');
            }
            const parsedId: number = isNaN(Number(id)) ? Number(id) : Number(id);
            const catFact = await this.demoService.getCatFact(parsedId);
            res.status(200).json(catFact);
        } catch (err) {
            next(err);
        }
    };

    triggerQueueSync = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { accountId, userId, force, priority } = req.body;
            if (!accountId || !userId) {
                throw createApiError(400, 'Bad Request', 'Missing accountId or userId', 'Please provide both accountId and userId in request body');
            }

            const jobId = await QueueService.addSyncAccountJob(
                {
                    accountId,
                    userId,
                    force: !!force,
                },
                priority !== undefined ? Number(priority) : 2
            );

            res.status(202).json({
                message: 'Successfully enqueued sync account job',
                jobId,
                queue: 'sync-account',
            });
        } catch (err) {
            next(err);
        }
    };
}
