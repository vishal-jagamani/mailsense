import { NODE_ENV } from '@config';
import { LOGGER_MODULE, MONITORING_PROVIDERS } from '@constants';
import { createLogger, registerTelemetrySink } from '@observability';
import {
    DefaultMonitoringConfig,
    IMonitoringProvider,
    LOG_LEVELS,
    MonitoringBreadcrumb,
    MonitoringConfig,
    MonitoringErrorContext,
    MonitoringProviderName,
    MonitoringUserContext,
    WorkerJobMetadata,
} from '@types';
import { NoopMonitoringProvider } from './providers/noop.provider.js';
import { SentryMonitoringProvider } from './providers/sentry.provider.js';

export class MonitoringManager implements IMonitoringProvider {
    private static instance: MonitoringManager | null = null;
    private provider: IMonitoringProvider;
    private readonly managerLogger = createLogger(LOGGER_MODULE.MONITORING_MANAGER, { forwardToMonitoring: false });
    private isInitialized = false;

    private constructor() {
        registerTelemetrySink(this);
        this.provider = this.createDefaultProvider();
    }

    public static getInstance(): MonitoringManager {
        if (!MonitoringManager.instance) {
            MonitoringManager.instance = new MonitoringManager();
        }
        return MonitoringManager.instance;
    }

    public get name(): MonitoringProviderName {
        return this.provider.name;
    }

    private createDefaultProvider(): IMonitoringProvider {
        try {
            // For tests, default to noop to prevent any remote API calls
            if (NODE_ENV === 'test') {
                return new NoopMonitoringProvider();
            }

            const configuredProvider = (process.env.MONITORING_PROVIDER || '').toLowerCase();

            switch (configuredProvider) {
                case MONITORING_PROVIDERS.SENTRY:
                    return new SentryMonitoringProvider();
                // case MONITORING_PROVIDERS.NEW_RELIC:
                //     return new NewRelicMonitoringProvider();
                case MONITORING_PROVIDERS.NOOP:
                    return new NoopMonitoringProvider();
                default:
                    // If Sentry DSN is present, default to Sentry; otherwise Noop
                    if (process.env.SENTRY_DSN) {
                        return new SentryMonitoringProvider();
                    }
                    return new NoopMonitoringProvider();
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.managerLogger.error(`Failed to resolve default monitoring provider: ${msg}`, { error });
            return new NoopMonitoringProvider();
        }
    }

    private getDefaultConfig(): DefaultMonitoringConfig {
        return {
            dsn: process.env.SENTRY_DSN,
            environment: NODE_ENV || 'development',
            release: process.env.APP_VERSION || '3.2.0',
            sampleRate: 1.0,
            sendDefaultPii: true,
            debug: false,
            enableLogs: process.env.SENTRY_ENABLE_LOGS !== 'false',
        };
    }

    private buildEffectiveConfig(config?: Partial<MonitoringConfig>): MonitoringConfig {
        const defaults = this.getDefaultConfig();
        if (!config) {
            return {
                provider: this.provider.name,
                ...defaults,
            };
        }

        return {
            provider: this.provider.name,
            dsn: config.dsn ?? defaults.dsn,
            environment: config.environment ?? defaults.environment,
            release: config.release ?? defaults.release,
            sampleRate: config.sampleRate ?? defaults.sampleRate,
            sendDefaultPii: config.sendDefaultPii ?? defaults.sendDefaultPii,
            debug: config.debug ?? defaults.debug,
            enableLogs: config.enableLogs ?? defaults.enableLogs,
        };
    }

    public init(config?: Partial<MonitoringConfig>): void {
        try {
            if (this.isInitialized) {
                this.managerLogger.warn('MonitoringManager is already initialized. Skipping re-init.');
                return;
            }

            const effectiveConfig = this.buildEffectiveConfig(config);

            this.provider.init(effectiveConfig);
            this.isInitialized = true;
            this.managerLogger.info(`Monitoring initialized with provider: [${this.provider.name}]`);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.managerLogger.error(`Critical error during MonitoringManager initialization: ${msg}`, { error });
        }
    }

    public setProvider(newProvider: IMonitoringProvider, config?: Partial<MonitoringConfig>): void {
        try {
            this.provider = newProvider;
            this.isInitialized = false;
            this.init(config);
            this.managerLogger.info(`Switched active monitoring provider to: [${newProvider.name}]`);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.managerLogger.error(`Failed to switch monitoring provider: ${msg}`, { error });
        }
    }

    public captureException(error: Error, context?: MonitoringErrorContext): void {
        this.provider.captureException(error, context);
    }

    public captureMessage(message: string, level: LOG_LEVELS = LOG_LEVELS.INFO, context?: Record<string, string | number | boolean>): void {
        this.provider.captureMessage(message, level, context);
    }

    public setUser(user: MonitoringUserContext | null): void {
        this.provider.setUser(user);
    }

    public addBreadcrumb(breadcrumb: MonitoringBreadcrumb): void {
        this.provider.addBreadcrumb(breadcrumb);
    }

    public reportWorkerError(error: Error, metadata: WorkerJobMetadata): void {
        this.provider.reportWorkerError(error, metadata);
    }
}

export const monitoring = MonitoringManager.getInstance();
