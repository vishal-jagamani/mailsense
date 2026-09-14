import { ErrorCode } from '../errors/ErrorCodes.js';

export type MonitoringProviderName = 'sentry' | 'newrelic' | 'noop';

export enum LOG_LEVELS {
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
    DEBUG = 'debug',
}

export interface MonitoringConfig {
    provider: MonitoringProviderName;
    dsn?: string;
    environment: string;
    release?: string;
    sampleRate?: number;
    sendDefaultPii?: boolean;
    debug?: boolean;
    enableLogs?: boolean;
}

export interface MonitoringUserContext {
    id: string;
    email?: string;
    username?: string;
    ipAddress?: string;
}

export interface MonitoringBreadcrumb {
    category: string;
    message: string;
    level?: LOG_LEVELS;
    timestamp?: number;
    data?: Record<string, string | number | boolean>;
}

export interface MonitoringErrorContext {
    traceId?: string;
    httpStatus?: number;
    errorCode?: ErrorCode;
    user?: MonitoringUserContext;
    tags?: Record<string, string | number | boolean>;
    extra?: Record<string, string | number | boolean>;
}

export interface WorkerJobMetadata {
    queueName: string;
    jobId: string;
    jobName: string;
    traceId?: string;
}

export interface IMonitoringProvider {
    readonly name: MonitoringProviderName;
    init(config: MonitoringConfig): Promise<void> | void;
    captureException(error: Error, context?: MonitoringErrorContext): void;
    captureMessage(message: string, level?: LOG_LEVELS, context?: Record<string, string | number | boolean>): void;
    setUser(user: MonitoringUserContext | null): void;
    addBreadcrumb(breadcrumb: MonitoringBreadcrumb): void;
    reportWorkerError(error: Error, metadata: WorkerJobMetadata): void;
}
