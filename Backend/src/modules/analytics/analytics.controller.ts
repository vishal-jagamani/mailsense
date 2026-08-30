import { AnalyticsQueryParams } from '@mailsense/types';
import { NextFunction, Request, Response } from 'express';
import { AnalyticsService } from './analytics.service.js';

export class AnalyticsController {
    private analyticsService: AnalyticsService;

    constructor() {
        this.analyticsService = new AnalyticsService();
    }

    public getDashboard = async (req: Request<object, object, object, AnalyticsQueryParams>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized: User ID is required' });
                return;
            }

            const data = await this.analyticsService.getDashboardAnalytics(userId, req.query);
            res.status(200).json({
                success: true,
                data,
                message: 'Dashboard analytics retrieved successfully',
            });
        } catch (error) {
            next(error);
        }
    };
}
