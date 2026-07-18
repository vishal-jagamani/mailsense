import { NextFunction, Request, Response } from 'express';

import { NODE_ENV } from '@config';
import { AppError } from '@errors';
import { logger } from 'shared/utils/index.js';

export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
    let error: AppError;

    if (err instanceof AppError) {
        error = err;
    } else {
        error = new AppError({
            message: 'Internal Server Error',
            status: 500,
            isOperational: false,
        });
    }

    const statusCode = error.status || 500;

    logger.error(`[${req.method}] ${req.url} -> ${statusCode} :: ${error.message}`, {
        stack: error.stack,
    });

    res.status(statusCode).json({
        success: false,
        error: {
            code: statusCode,
            message: error.message,
            description: error.description || 'Something went wrong while processing your request.',
            suggestedAction: error.suggestedAction || 'Please try again later or contact support.',

            // ✅ Only in development
            ...(NODE_ENV === 'local' && {
                stack: error.stack,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                external: (error as any).originalError,
            }),
        },
    });
};
