import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger.js';

interface ExtendedError extends Error {
    status?: number;
    isOperational?: boolean;
    description?: string;
    suggestedAction?: string;
}

// ✅ Known operational API errors
export const apiErrorHandler = (err: ExtendedError, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.status || 500;
    const message = err.message || 'Internal Server Error';

    logError(req, statusCode, err);

    if (err.isOperational !== false && err.status) {
        res.status(statusCode).json({
            error: {
                code: statusCode,
                message,
                description: err.description || 'A known error occurred in the API flow.',
                suggestedAction: err.suggestedAction || 'Please review your request or check documentation.',
            },
        });
    } else {
        next(err); // pass to global handler if unknown
    }
};

// 🌐 Global unknown error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: ExtendedError, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.status || 500;
    const message = err.message || 'Internal Server Error';

    logError(req, statusCode, err);

    res.status(statusCode).json({
        status: false,
        error: {
            code: statusCode,
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        },
    });
};

// 🔍 Logging utility (replace with Winston or Pino in production)
const logError = (req: Request, statusCode: number, err: Error) => {
    logger.error(`[${req.method}] ${req.url} -> ${statusCode} :: ${err.message}`);
    if (process.env.NODE_ENV === 'development') {
        logger.error(`Stack trace:`, { stack: err.stack });
    }
};
