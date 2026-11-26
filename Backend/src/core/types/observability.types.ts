import { LOG_LEVELS } from './monitoring.types.js';

export interface TraceStore {
    traceId: string;
    userId?: string;
    accountId?: string;
    userEmail?: string;
    userName?: string;
}

export interface CreateLoggerOptions {
    forwardToMonitoring?: boolean;
}

export type LoggableValue = string | number | boolean | Error | object | unknown | undefined;

export interface LogContext {
    traceId?: string;
    userId?: string;
    userEmail?: string;
    userName?: string;
    accountId?: string;
    provider?: string;
    operation?: string;
    durationMs?: number;
    errorCode?: string;
    statusCode?: number;
    method?: string;
    path?: string;
    userAgent?: string;
    jobId?: string;
    queueName?: string;
    jobName?: string;
    error?: LoggableValue;
    stack?: string;
    [key: string]: LoggableValue;
}

export interface ModuleLogger {
    info(msg: string, ctx?: LogContext): void;
    error(msg: string, ctx?: LogContext): void;
    warn(msg: string, ctx?: LogContext): void;
    debug(msg: string, ctx?: LogContext): void;
}

export interface TelemetryBreadcrumb {
    category: string;
    message: string;
    level: LOG_LEVELS;
    data?: Record<string, string | number | boolean>;
}

export interface TelemetryExceptionContext {
    tags?: Record<string, string | number | boolean>;
    extra?: Record<string, string | number | boolean>;
}

export interface ITelemetrySink {
    addBreadcrumb(breadcrumb: TelemetryBreadcrumb): void;
    captureException(error: Error, context?: TelemetryExceptionContext): void;
}
