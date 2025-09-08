import { NextFunction, Request, Response } from 'express';
import { createApiError } from '../../utils/api.error';
import { DemoService } from './demo.service';

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
}
