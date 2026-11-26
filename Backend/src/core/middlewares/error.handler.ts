import { NODE_ENV } from '@config';
import { LOGGER_MODULE } from '@constants';
import { AppError, AxiosApiError, ErrorCode } from '@errors';
import { ERROR_LOG_SEVERITY, ERROR_LOG_SOURCE } from '@mailsense/types';
import { ObservabilityService } from '@modules/observability/services/index.js';
import { monitoring } from '@monitoring';
import { createLogger } from '@observability';
import { CaughtError, ErrorResponsePayload } from '@types';
import { NextFunction, Request, Response } from 'express';

const logger = createLogger(LOGGER_MODULE.SERVER, { forwardToMonitoring: false });

const normalizeAppError = (err: CaughtError): AppError => {
    let appError: AppError;
    if (err instanceof AppError) {
        appError = err;
    } else if (err instanceof Error) {
        appError = new AppError({
            message: err.message,
            httpStatus: 500,
            errorCode: ErrorCode.INTERNAL_ERROR,
            isOperational: false,
            description: 'An unhandled internal application error occurred.',
            suggestedAction: 'Please try again later. System administrators have been alerted.',
        });
        appError.stack = err.stack;
    } else {
        appError = new AppError({
            message: 'An unexpected and unclassified error occurred.',
            httpStatus: 500,
            errorCode: ErrorCode.INTERNAL_ERROR,
            isOperational: false,
        });
    }
    return appError;
};

const captureNonOperationalErrors = (appError: AppError, statusCode: number, req: Request): void => {
    monitoring.captureException(appError, {
        traceId: appError.traceId,
        httpStatus: statusCode,
        errorCode: appError.errorCode,
        user: req.user ? { id: req.user.id, email: req.user.email } : undefined,
        tags: {
            method: req.method,
            path: req.path,
        },
        extra: {
            url: req.originalUrl,
            query: JSON.stringify(req.query),
        },
    });
};

const reportUnhandledException = (appError: AppError, statusCode: number, req: Request): void => {
    if (appError.isOperational && statusCode < 500) {
        return;
    }

    captureNonOperationalErrors(appError, statusCode, req);
    const severity = statusCode >= 500 && !appError.isOperational ? ERROR_LOG_SEVERITY.CRITICAL : ERROR_LOG_SEVERITY.ERROR;

    const observabilityService = new ObservabilityService();

    void observabilityService.recordAndAlertError({
        source: ERROR_LOG_SOURCE.BACKEND_API,
        severity,
        module: LOGGER_MODULE.SERVER,
        errorCode: appError.errorCode,
        httpStatus: statusCode,
        message: appError.message,
        stack: appError.stack,
        traceId: appError.traceId,
        context: {
            userId: req.user?.id,
            method: req.method,
            path: req.path,
        },
    });
};

export const errorHandler = (err: CaughtError, req: Request, res: Response, _next: NextFunction): void => {
    try {
        const appError = normalizeAppError(err);
        const statusCode = appError.httpStatus || 500;
        const isDev = NODE_ENV === 'local' || NODE_ENV === 'development';

        logger.error(`[${req.method}] ${req.url} -> ${statusCode} [${appError.errorCode}] :: ${appError.message}`, {
            errorCode: appError.errorCode,
            traceId: appError.traceId,
            httpStatus: statusCode,
            stack: appError.stack,
        });

        reportUnhandledException(appError, statusCode, req);

        const errorPayload: ErrorResponsePayload = appError.toJSON(isDev);
        if (isDev && appError instanceof AxiosApiError && appError.originalError) {
            errorPayload.error.external = appError.originalError;
        }

        res.status(statusCode).json(errorPayload);
    } catch (criticalHandlerError) {
        const fallbackMessage = criticalHandlerError instanceof Error ? criticalHandlerError.message : String(criticalHandlerError);
        logger.error(`Critical failure in errorHandler middleware: ${fallbackMessage}`);

        res.status(500).json({
            status: false,
            message: 'Internal Server Error',
            error: {
                code: 500,
                errorCode: ErrorCode.INTERNAL_ERROR,
                traceId: '',
                description: 'A critical unexpected error occurred while processing the error response.',
            },
        });
    }
};
