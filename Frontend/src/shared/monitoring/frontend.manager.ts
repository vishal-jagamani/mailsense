import { FRONTEND_MONITORING_PROVIDERS } from '@shared/constants';
import {
    BreadcrumbCategory,
    BreadcrumbLevel,
    FrontendErrorContext,
    FrontendMonitoringConfig,
    FrontendMonitoringProviderName,
    FrontendUserContext,
    IFrontendMonitoringProvider,
    UserActionBreadcrumb,
} from '@shared/types';
import { ConsoleFrontendProvider } from './providers/console-frontend.provider';
import { SentryFrontendProvider } from './providers/sentry-frontend.provider';
import { sessionTracker } from './session.tracker';

export class FrontendMonitoringManager implements IFrontendMonitoringProvider {
    private static instance: FrontendMonitoringManager | null = null;
    private provider: IFrontendMonitoringProvider;
    private isInitialized = false;

    private constructor() {
        this.provider = this.createDefaultProvider();
    }

    public static getInstance(): FrontendMonitoringManager {
        if (!FrontendMonitoringManager.instance) {
            FrontendMonitoringManager.instance = new FrontendMonitoringManager();
        }
        return FrontendMonitoringManager.instance;
    }

    public get name(): FrontendMonitoringProviderName {
        return this.provider.name;
    }

    private createDefaultProvider(): IFrontendMonitoringProvider {
        try {
            const configured = process.env.NEXT_PUBLIC_MONITORING_PROVIDER?.toLowerCase();
            if (configured === FRONTEND_MONITORING_PROVIDERS.SENTRY) {
                return new SentryFrontendProvider();
            }
            return new ConsoleFrontendProvider();
        } catch {
            return new ConsoleFrontendProvider();
        }
    }

    public init(config?: Partial<FrontendMonitoringConfig>): void {
        try {
            if (this.isInitialized) return;

            const effectiveConfig: FrontendMonitoringConfig = {
                provider: this.provider.name,
                environment: config?.environment ?? process.env.NODE_ENV ?? 'development',
                release: config?.release ?? '3.2.0',
                dsn: config?.dsn ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
                maxBreadcrumbs: config?.maxBreadcrumbs ?? 50,
            };

            this.provider.init(effectiveConfig);
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize FrontendMonitoringManager', error);
        }
    }

    public setProvider(newProvider: IFrontendMonitoringProvider, config?: Partial<FrontendMonitoringConfig>): void {
        this.provider = newProvider;
        this.isInitialized = false;
        this.init(config);
    }

    public captureException(error: Error, context?: FrontendErrorContext): void {
        try {
            const enrichedContext: FrontendErrorContext = {
                ...context,
                breadcrumbs: sessionTracker.getRecentBreadcrumbs(),
            };
            this.provider.captureException(error, enrichedContext);
        } catch {
            // Non-blocking
        }
    }

    public captureBreadcrumb(breadcrumb: UserActionBreadcrumb): void {
        sessionTracker.addBreadcrumb(breadcrumb.category, breadcrumb.message, breadcrumb.level, breadcrumb.data);
        this.provider.captureBreadcrumb(breadcrumb);
    }

    public setUser(user: FrontendUserContext | null): void {
        this.provider.setUser(user);
    }

    public getSessionId(): string {
        return sessionTracker.getSessionId();
    }
}

export const frontendMonitoring = FrontendMonitoringManager.getInstance();

/**
 * Ergonomic helper to record user interaction breadcrumbs
 */
export function trackUserAction(
    category: BreadcrumbCategory,
    message: string,
    level: BreadcrumbLevel = 'info',
    data?: Record<string, string | number | boolean>,
): void {
    try {
        frontendMonitoring.captureBreadcrumb({
            category,
            message,
            level,
            timestamp: Date.now(),
            data,
        });
    } catch {
        // Non-blocking
    }
}
