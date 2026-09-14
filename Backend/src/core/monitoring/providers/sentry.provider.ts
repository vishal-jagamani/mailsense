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
    WorkerJobMetadata,
} from '@types';

const REDUNDANT_USER_KEYS = new Set([
    'userId',
    'user_id',
    'user.id',
    'userEmail',
    'user_email',
    'user.email',
    'userName',
    'user_name',
    'user.username',
]);

function omitUserKeys(data?: Record<string, string | number | boolean>): Record<string, string | number | boolean> {
    if (!data) return {};
    const result: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(data)) {
        if (!REDUNDANT_USER_KEYS.has(key)) {
            result[key] = value;
        }
    }
    return result;
}

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
            const rawId = override?.id ?? trace?.userId ?? isolationUser?.id;
            if (!rawId) return null;

            return {
                id: String(rawId),
                email: override?.email ?? trace?.userEmail ?? (isolationUser?.email || undefined),
                username: override?.username ?? trace?.userName ?? (isolationUser?.username || undefined),
                ipAddress: override?.ipAddress ?? (isolationUser?.ip_address || undefined),
            };
        } catch {
            return null;
        }
    }

    public captureException(error: Error, context?: MonitoringErrorContext): void {
        try {
            if (!this.initialized) {
                this.providerLogger.debug(`[Sentry Not Initialized] captureException: ${error.message}`);
                return;
            }

            const trace = getTraceStore();
            const activeUser = this.resolveActiveUser(context?.user);

            Sentry.withScope((scope) => {
                const traceId = context?.traceId ?? trace?.traceId;
                if (traceId) scope.setTag('traceId', traceId);

                if (context?.errorCode) scope.setTag('errorCode', context.errorCode);

                if (context?.httpStatus) scope.setExtra('httpStatus', context.httpStatus);

                if (activeUser) {
                    scope.setUser({
                        id: activeUser.id,
                        email: activeUser.email,
                        username: activeUser.username,
                        ip_address: activeUser.ipAddress,
                    });
                }
                if (context?.tags) {
                    for (const [key, value] of Object.entries(context.tags)) {
                        scope.setTag(key, String(value));
                    }
                }
                if (context?.extra) {
                    for (const [key, value] of Object.entries(context.extra)) {
                        scope.setExtra(key, value);
                    }
                }

                Sentry.captureException(error);

                // Also stream directly to Sentry Logs Explorer product
                const logAttributes: Record<string, string | number | boolean> = {
                    category: 'error',
                    ...(context?.errorCode ? { errorCode: context.errorCode } : {}),
                    ...(traceId ? { traceId } : {}),
                    ...(trace?.accountId ? { accountId: trace.accountId } : {}),
                    ...(context?.httpStatus ? { httpStatus: context.httpStatus } : {}),
                    ...omitUserKeys(context?.tags),
                    ...omitUserKeys(context?.extra),
                };
                Sentry.logger.error(error.message, logAttributes);
            });
        } catch (captureError) {
            const msg = captureError instanceof Error ? captureError.message : String(captureError);
            this.providerLogger.error(`Error in Sentry captureException: ${msg}`, { error: captureError });
        }
    }

    public captureMessage(message: string, level?: LOG_LEVELS, context?: Record<string, string | number | boolean>): void {
        try {
            if (!this.initialized) {
                return;
            }

            const trace = getTraceStore();
            const overrideUser: Partial<MonitoringUserContext> | undefined =
                context?.userId || context?.userEmail || context?.userName
                    ? {
                          id: context.userId as string | undefined,
                          email: context.userEmail as string | undefined,
                          username: context.userName as string | undefined,
                      }
                    : undefined;
            const activeUser = this.resolveActiveUser(overrideUser);

            Sentry.withScope((scope) => {
                if (context) {
                    for (const [key, value] of Object.entries(context)) {
                        scope.setExtra(key, value);
                    }
                }
                if (activeUser) {
                    scope.setUser({
                        id: activeUser.id,
                        email: activeUser.email,
                        username: activeUser.username,
                        ip_address: activeUser.ipAddress,
                    });
                }
                Sentry.captureMessage(message, level as SeverityLevel);
            });

            const logAttributes: Record<string, string | number | boolean> = {
                category: 'message',
                ...(trace?.traceId ? { traceId: trace.traceId } : {}),
                ...(trace?.accountId ? { accountId: trace.accountId } : {}),
                ...omitUserKeys(context),
            };

            // Also stream to Sentry Logs Explorer
            if (level === LOG_LEVELS.WARN) Sentry.logger.warn(message, logAttributes);
            else if (level === LOG_LEVELS.ERROR) Sentry.logger.error(message, logAttributes);
            else if (level === LOG_LEVELS.DEBUG) Sentry.logger.debug(message, logAttributes);
            else Sentry.logger.info(message, logAttributes);
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

    public addBreadcrumb(breadcrumb: MonitoringBreadcrumb): void {
        try {
            if (!this.initialized) return;

            // 1. Record breadcrumb for Issue/Error context
            Sentry.addBreadcrumb({
                category: breadcrumb.category,
                message: breadcrumb.message,
                level: (breadcrumb.level ?? LOG_LEVELS.INFO) as SeverityLevel,
                timestamp: breadcrumb.timestamp ? breadcrumb.timestamp / 1000 : undefined,
                data: breadcrumb.data,
            });

            // 2. Dispatch to Sentry Logs Explorer product (Sentry.logger)
            const trace = getTraceStore();
            const isolationUser = Sentry.getIsolationScope().getUser();

            const rawUserId = (breadcrumb.data?.userId as string | undefined) ?? (breadcrumb.data?.['user.id'] as string | undefined);
            const rawUserEmail = (breadcrumb.data?.userEmail as string | undefined) ?? (breadcrumb.data?.['user.email'] as string | undefined);
            const rawUserName = (breadcrumb.data?.userName as string | undefined) ?? (breadcrumb.data?.['user.username'] as string | undefined);

            const overrideUser: Partial<MonitoringUserContext> | undefined =
                rawUserId || rawUserEmail || rawUserName
                    ? { id: rawUserId, email: rawUserEmail, username: rawUserName }
                    : undefined;

            const activeUser = this.resolveActiveUser(overrideUser);

            // Synchronize Sentry user context if not yet populated on isolation scope
            if (activeUser && (!isolationUser?.id || isolationUser.id !== activeUser.id)) {
                Sentry.setUser({
                    id: activeUser.id,
                    email: activeUser.email,
                    username: activeUser.username,
                    ip_address: activeUser.ipAddress,
                });
            }

            const cleanData = omitUserKeys(breadcrumb.data);

            const attributes: Record<string, string | number | boolean> = {
                category: breadcrumb.category,
                ...(trace?.traceId ? { traceId: trace.traceId } : {}),
                ...(trace?.accountId ? { accountId: trace.accountId } : {}),
                ...cleanData,
            };
            const message = breadcrumb.message || 'Log message';

            switch (breadcrumb.level) {
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
