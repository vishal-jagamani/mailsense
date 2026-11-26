import { ReportClientErrorPayload, ReportClientErrorResponse } from '@mailsense/types';
import { getTraceUserId } from '@observability';
import { NextFunction, Request, Response } from 'express';
import { ObservabilityService } from '../services/index.js';

export class ObservabilityController {
    constructor(private readonly observabilityService: ObservabilityService = new ObservabilityService()) {}

    public reportClientError = async (req: Request<object, object, ReportClientErrorPayload>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id || req.header('x-user-id') || getTraceUserId();
            const userAgent = req.get('user-agent');
            const result = await this.observabilityService.recordClientError(req.body, userId, userAgent);

            const responsePayload: ReportClientErrorResponse = {
                status: true,
                traceId: result.traceId,
                logged: result.logged,
            };

            res.status(201).json(responsePayload);
        } catch (error) {
            next(error);
        }
    };
}
