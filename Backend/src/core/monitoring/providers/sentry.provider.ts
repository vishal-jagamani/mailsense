import type { SeverityLevel } from '@sentry/node';
import * as Sentry from '@sentry/node';

import { LOGGER_MODULE, MONITORING_PROVIDERS } from '@constants';
import { createLogger, getTraceStore } from '@observability';
import {
    IMonitoringProvider,
    LOG_LEVELS,
    MonitoringBreadcrumb,
    MonitoringConfig,
    MonitoringErrorContext,
    MonitoringProviderName,
    MonitoringUserContext,
    TraceStore,
    WorkerJobMetadata,
} from '@types';
import { extractOverrideUserFromData, extractUserEmail, extractUserId, extractUserIp, extractUserUsername, omitUserKeys } from './sentry.utils.js';

export class SentryMonitoringProvider implements IMonitoringProvider {
    public readonly name: MonitoringProviderName = MONITORING_PROVIDERS.SENTRY;
    private readonly providerLogger = createLogger(LOGGER_MODULE.SENTRY_PROVIDER, { forwardToMonitoring: false });
    private initialized = false;

    public init(config: MonitoringConfig): void {
        try {
            if (!config.dsn) {
                this.providerLogger.warn('Sentry DSN not provided. Falling back to local logging mode.');
                return;
            }

            Sentry.init({
                dsn: config.dsn,
                environment: config.environment,
                release: config.release,
                tracesSampleRate: config.sampleRate ?? 1.0,
                sendDefaultPii: config.sendDefaultPii ?? true,
                enableLogs: config.enableLogs ?? true,
                integrations: [Sentry.expressIntegration()],
            });

            this.initialized = true;
            this.providerLogger.info('✅ Sentry monitoring provider initialized successfully', {
                environment: config.environment,
                release: config.release ?? 'unknown',
            });
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.providerLogger.error(`Failed to initialize Sentry provider: ${msg}`, { error });
        }
    }

    private resolveActiveUser(override?: Partial<MonitoringUserContext>): MonitoringUserContext | null {
        try {
            const trace = getTraceStore();
            const isolationUser = Sentry.getIsolationScope().getUser();
            const id = extractUserId(override, trace, isolationUser);
            if (!id) return null;

            return {
                id,
                email: extractUserEmail(override, trace, isolationUser),
                username: extractUserUsername(override, trace, isolationUser),
                ipAddress: extractUserIp(override, isolationUser),
            };
        } catch {
            return null;
        }
    }

    private populateScopeTags(scope: Sentry.Scope, traceId?: string, errorCode?: string, tags?: Record<string, string | number | boolean>): void {
        if (traceId) scope.setTag('traceId', traceId);
        if (errorCode) scope.setTag('errorCode', errorCode);
        if (tags) {
            for (const [key, value] of Object.entries(tags)) {
                scope.setTag(key, String(value));
            }
        }
    }

    private populateScopeExtras(scope: Sentry.Scope, httpStatus?: number, extra?: Record<string, string | number | boolean>): void {
        if (httpStatus) scope.setExtra('httpStatus', httpStatus);
        if (extra) {
            for (const [key, value] of Object.entries(extra)) {
                scope.setExtra(key, value);
            }
        }
    }

    private setScopeUser(scope: Sentry.Scope, activeUser?: MonitoringUserContext | null): void {
        if (!activeUser) return;
        scope.setUser({
            id: activeUser.id,
            email: activeUser.email,
            username: activeUser.username,
            ip_address: activeUser.ipAddress,
        });
    }

    private buildErrorLogAttributes(
        context?: MonitoringErrorContext,
        traceId?: string,
        accountId?: string,
    ): Record<string, string | number | boolean> {
        const logAttributes: Record<string, string | number | boolean> = {
            category: 'error',
            ...omitUserKeys(context?.tags),
            ...omitUserKeys(context?.extra),
        };
        if (context?.errorCode) logAttributes.errorCode = context.errorCode;
        if (traceId) logAttributes.traceId = traceId;
        if (accountId) logAttributes.accountId = accountId;
        if (context?.httpStatus) logAttributes.httpStatus = context.httpStatus;
        return logAttributes;
    }

    public captureException(error: Error, context?: MonitoringErrorContext): void {
        try {
            if (!this.initialized) {
                this.providerLogger.debug(`[Sentry Not Initialized] captureException: ${error.message}`);
                return;
            }

            const trace = getTraceStore();
            const activeUser = this.resolveActiveUser(context?.user);
            const traceId = context?.traceId ?? trace?.traceId;

            Sentry.withScope((scope) => {
                this.populateScopeTags(scope, traceId, context?.errorCode, context?.tags);
                this.populateScopeExtras(scope, context?.httpStatus, context?.extra);
                this.setScopeUser(scope, activeUser);

                Sentry.captureException(error);

                const logAttributes = this.buildErrorLogAttributes(context, traceId, trace?.accountId);
                Sentry.logger.error(error.message, logAttributes);
            });
        } catch (captureError) {
            const msg = captureError instanceof Error ? captureError.message : String(captureError);
            this.providerLogger.error(`Error in Sentry captureException: ${msg}`, { error: captureError });
        }
    }

    private buildMessageLogAttributes(
        context?: Record<string, string | number | boolean>,
        traceId?: string,
        accountId?: string,
    ): Record<string, string | number | boolean> {
        const logAttributes: Record<string, string | number | boolean> = {
            category: 'message',
            ...omitUserKeys(context),
        };
        if (traceId) logAttributes.traceId = traceId;
        if (accountId) logAttributes.accountId = accountId;
        return logAttributes;
    }

    private logToSentry(level: string, message: string, attributes: Record<string, string | number | boolean>): void {
        switch (level) {
            case LOG_LEVELS.WARN:
                Sentry.logger.warn(message, attributes);
                break;
            case LOG_LEVELS.DEBUG:
                Sentry.logger.debug(message, attributes);
                break;
            case LOG_LEVELS.ERROR:
                Sentry.logger.error(message, attributes);
                break;
            case LOG_LEVELS.INFO:
            default:
                Sentry.logger.info(message, attributes);
                break;
        }
    }

    public captureMessage(message: string, level?: LOG_LEVELS, context?: Record<string, string | number | boolean>): void {
        try {
            if (!this.initialized) return;

            const trace = getTraceStore();
            const overrideUser = extractOverrideUserFromData(context);
            const activeUser = this.resolveActiveUser(overrideUser);

            Sentry.withScope((scope) => {
                this.populateScopeExtras(scope, undefined, context);
                this.setScopeUser(scope, activeUser);
                Sentry.captureMessage(message, level as SeverityLevel);
            });

            const traceId = trace?.traceId;
            const logAttributes = this.buildMessageLogAttributes(context, traceId, trace?.accountId);
            this.logToSentry(level ?? LOG_LEVELS.INFO, message, logAttributes);
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.providerLogger.error(`Error in Sentry captureMessage: ${msg}`, { error: err });
        }
    }

    public setUser(user: MonitoringUserContext | null): void {
        try {
            if (!this.initialized) return;

            if (user) {
                Sentry.setUser({
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    ip_address: user.ipAddress,
                });
            } else {
                Sentry.setUser(null);
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.providerLogger.error(`Error in Sentry setUser: ${msg}`, { error: err });
        }
    }

    private recordSentryBreadcrumb(breadcrumb: MonitoringBreadcrumb): void {
        const timestamp = breadcrumb.timestamp ? breadcrumb.timestamp / 1000 : undefined;
        Sentry.addBreadcrumb({
            category: breadcrumb.category,
            message: breadcrumb.message,
            level: (breadcrumb.level ?? LOG_LEVELS.INFO) as SeverityLevel,
            timestamp,
            data: breadcrumb.data,
        });
    }

    private syncIsolationUser(activeUser: MonitoringUserContext | null): void {
        if (!activeUser) return;
        const isolationUser = Sentry.getIsolationScope().getUser();
        if (!isolationUser?.id || isolationUser.id !== activeUser.id) {
            Sentry.setUser({
                id: activeUser.id,
                email: activeUser.email,
                username: activeUser.username,
                ip_address: activeUser.ipAddress,
            });
        }
    }

    private buildBreadcrumbLogAttributes(breadcrumb: MonitoringBreadcrumb, trace?: TraceStore): Record<string, string | number | boolean> {
        const attributes: Record<string, string | number | boolean> = {
            category: breadcrumb.category,
            ...omitUserKeys(breadcrumb.data),
        };
        if (trace?.traceId) attributes.traceId = trace.traceId;
        if (trace?.accountId) attributes.accountId = trace.accountId;
        return attributes;
    }

    public addBreadcrumb(breadcrumb: MonitoringBreadcrumb): void {
        try {
            if (!this.initialized) return;

            this.recordSentryBreadcrumb(breadcrumb);

            const overrideUser = extractOverrideUserFromData(breadcrumb.data);
            const activeUser = this.resolveActiveUser(overrideUser);
            this.syncIsolationUser(activeUser);

            const trace = getTraceStore();
            const attributes = this.buildBreadcrumbLogAttributes(breadcrumb, trace);
            const message = breadcrumb.message || 'Log message';

            this.logToSentry(breadcrumb.level ?? LOG_LEVELS.INFO, message, attributes);
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.providerLogger.error(`Error in Sentry addBreadcrumb: ${msg}`, { error: err });
        }
    }

    public reportWorkerError(error: Error, metadata: WorkerJobMetadata): void {
        try {
            if (!this.initialized) return;

            Sentry.withScope((scope) => {
                scope.setTag('workerQueue', metadata.queueName);
                scope.setTag('jobName', metadata.jobName);
                scope.setExtra('jobId', metadata.jobId);

                if (metadata.traceId) scope.setTag('traceId', metadata.traceId);

                Sentry.captureException(error);
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.providerLogger.error(`Error in Sentry reportWorkerError: ${msg}`, { error: err });
        }
    }
}
