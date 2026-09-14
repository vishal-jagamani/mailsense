import { LOGGER_MODULE } from '@constants';
import { createLogger } from '@observability';
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

export class NoopMonitoringProvider implements IMonitoringProvider {
    public readonly name: MonitoringProviderName = 'noop';
    private readonly providerLogger = createLogger(LOGGER_MODULE.NOOP_MONITORING_PROVIDER, { forwardToMonitoring: false });

    public init(config: MonitoringConfig): void {
        try {
            this.providerLogger.debug('No-op monitoring provider initialized (local/test mode)', {
                environment: config.environment,
            });
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.providerLogger.error(`Error in Noop init: ${msg}`, { error });
        }
    }

    public captureException(error: Error, context?: MonitoringErrorContext): void {
        try {
            this.providerLogger.debug(`[Noop Capture] Exception: ${error.message}`, {
                traceId: context?.traceId,
                errorCode: context?.errorCode,
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.providerLogger.error(`Error in Noop captureException: ${msg}`, { error: err });
        }
    }

    public captureMessage(message: string, level?: LOG_LEVELS, context?: Record<string, string | number | boolean>): void {
        try {
            this.providerLogger.debug(`[Noop Message] [${level ?? LOG_LEVELS.INFO}] ${message}`, context);
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.providerLogger.error(`Error in Noop captureMessage: ${msg}`, { error: err });
        }
    }

    public setUser(_user: MonitoringUserContext | null): void {
        // No-op by design
    }

    public addBreadcrumb(_breadcrumb: MonitoringBreadcrumb): void {
        // No-op by design
    }

    public reportWorkerError(error: Error, metadata: WorkerJobMetadata): void {
        try {
            this.providerLogger.debug(`[Noop Worker Error] Queue: ${metadata.queueName} - Job: ${metadata.jobId}: ${error.message}`);
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.providerLogger.error(`Error in Noop reportWorkerError: ${msg}`, { error: err });
        }
    }
}
