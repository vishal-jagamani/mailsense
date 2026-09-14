import { HEALTH_PROBES_API_ENDPOINTS, LOGGER_MODULE } from '@constants';
import { NextFunction, Request, Response } from 'express';
import { createLogger } from './logger.factory.js';
import { getTraceId } from './trace.js';

const requestLogger = createLogger(LOGGER_MODULE.HTTP);

/**
 * Express middleware that logs inbound HTTP requests and outbound responses.
 * Automatically skips health check and test probe endpoints to reduce log volume.
 */
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
    try {
        const url = req.originalUrl || req.url;

        // Skip health probes to avoid log flooding
        if ((HEALTH_PROBES_API_ENDPOINTS as readonly string[]).includes(url)) {
            next();
            return;
        }

        const start = performance.now();
        const method = req.method;
        const userAgent = req.get('user-agent') || 'unknown';
        const traceId = getTraceId();

        requestLogger.info(`--> [${method}] ${url}`, {
            traceId,
            method,
            path: url,
            userAgent,
        });

        res.on('finish', () => {
            try {
                const durationMs = Math.round(performance.now() - start);
                const statusCode = res.statusCode;

                const logData = {
                    traceId,
                    method,
                    path: url,
                    statusCode,
                    durationMs,
                };

                if (statusCode >= 400) {
                    requestLogger.warn(`<-- [${method}] ${url} ${statusCode} [${durationMs}ms]`, logData);
                } else {
                    requestLogger.info(`<-- [${method}] ${url} ${statusCode} [${durationMs}ms]`, logData);
                }
                // eslint-disable-next-line unused-imports/no-unused-vars
            } catch (finishError) {
                // Prevent finish listener errors from escaping
            }
        });

        next();
        // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (error) {
        next();
    }
}
