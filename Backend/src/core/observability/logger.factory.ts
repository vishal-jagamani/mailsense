import { LOGGER_MODULE } from '@constants';
import { CreateLoggerOptions, ITelemetrySink, LOG_LEVELS, LogContext, ModuleLogger } from '@types';
import { log } from '../config/logger.config.js';

let activeTelemetrySink: ITelemetrySink | null = null;

export function registerTelemetrySink(sink: ITelemetrySink | null): void {
    activeTelemetrySink = sink;
}

/**
 * Resolves or constructs an Error object from context or message
 */
function resolveError(msg: string, ctx?: LogContext): Error {
    try {
        if (ctx?.error instanceof Error) {
            return ctx.error;
        }
        if (typeof ctx?.error === 'string') {
            return new Error(`${msg}: ${ctx.error}`);
        }
        return new Error(msg);
    } catch {
        return new Error(msg);
    }
}

/**
 * Sanitizes LogContext into string/number/boolean map for APM data contracts
 */
function sanitizeContext(ctx: LogContext): Record<string, string | number | boolean> {
    try {
        const sanitized: Record<string, string | number | boolean> = {};
        for (const [key, value] of Object.entries(ctx)) {
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                sanitized[key] = value;
            } else if (value instanceof Error) {
                sanitized[key] = value.message;
            }
        }
        return sanitized;
    } catch {
        return {};
    }
}

/**
 * Creates a child Pino logger bound to a specific application module name,
 * with automatic, non-blocking telemetry bridging to the registered APM provider.
 */
export function createLogger(moduleName: LOGGER_MODULE | string, options?: CreateLoggerOptions): ModuleLogger {
    const child = log.child({ module: moduleName });
    const shouldForward = options?.forwardToMonitoring !== false;

    return {
        info: (msg: string, ctx?: LogContext): void => {
            try {
                if (ctx) child.info(ctx, msg);
                else child.info(msg);

                if (shouldForward && activeTelemetrySink) {
                    activeTelemetrySink.addBreadcrumb({
                        category: moduleName,
                        message: msg,
                        level: LOG_LEVELS.INFO,
                        data: ctx ? sanitizeContext(ctx) : undefined,
                    });
                }
            } catch {
                // Non-blocking fallback
            }
        },

        error: (msg: string, ctx?: LogContext): void => {
            try {
                if (ctx) child.error(ctx, msg);
                else child.error(msg);

                if (shouldForward && activeTelemetrySink) {
                    const extractedError = resolveError(msg, ctx);
                    activeTelemetrySink.captureException(extractedError, {
                        tags: { module: moduleName },
                        extra: ctx ? sanitizeContext(ctx) : undefined,
                    });
                }
            } catch {
                // Non-blocking fallback
            }
        },

        warn: (msg: string, ctx?: LogContext): void => {
            try {
                if (ctx) child.warn(ctx, msg);
                else child.warn(msg);

                if (shouldForward && activeTelemetrySink) {
                    activeTelemetrySink.addBreadcrumb({
                        category: moduleName,
                        message: msg,
                        level: LOG_LEVELS.WARN,
                        data: ctx ? sanitizeContext(ctx) : undefined,
                    });
                }
            } catch {
                // Non-blocking fallback
            }
        },

        debug: (msg: string, ctx?: LogContext): void => {
            try {
                if (ctx) child.debug(ctx, msg);
                else child.debug(msg);

                if (shouldForward && activeTelemetrySink) {
                    activeTelemetrySink.addBreadcrumb({
                        category: moduleName,
                        message: msg,
                        level: LOG_LEVELS.DEBUG,
                        data: ctx ? sanitizeContext(ctx) : undefined,
                    });
                }
            } catch {
                // Non-blocking fallback
            }
        },
    };
}

/**
 * Wraps an asynchronous operation, measuring and logging its execution duration in milliseconds.
 */
export async function withTiming<T>(logger: ModuleLogger, operationName: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
        const result = await fn();
        const durationMs = Math.round(performance.now() - start);
        logger.info(`${operationName} completed successfully`, {
            operation: operationName,
            durationMs,
        });
        return result;
    } catch (error) {
        const durationMs = Math.round(performance.now() - start);
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`${operationName} failed after ${durationMs}ms: ${errorMessage}`, {
            operation: operationName,
            durationMs,
            error: error instanceof Error ? error : new Error(errorMessage),
        });
        throw error;
    }
}
