import { UnauthorizedError } from '@errors';
import { NextFunction, Request, Response } from 'express';
import { GetEmailSummaryParamsSchema, GetSuggestedRepliesParamsSchema } from '../schema/ai.schema.js';
import { AIService } from '../services/index.js';

export class AIController {
    constructor(private readonly service: AIService = new AIService()) {}

    public summarizeThread = async (
        req: Request<GetEmailSummaryParamsSchema, object, object, object>,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError('User authentication required');
            }

            const { emailId } = req.params;
            const summary = await this.service.summarizeThread(userId, emailId);
            res.status(200).json({
                status: true,
                message: 'Thread summarized successfully',
                data: summary,
            });
        } catch (error) {
            next(error);
        }
    };

    public getSuggestedReplies = async (
        req: Request<GetSuggestedRepliesParamsSchema, object, object, object>,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError('User authentication required');
            }

            const { emailId } = req.params;
            const suggestions = await this.service.getSuggestedReplies(userId, emailId);
            res.status(200).json({
                status: true,
                message: 'Suggested replies generated successfully',
                data: suggestions,
            });
        } catch (error) {
            next(error);
        }
    };
}
