import {
    FrontendErrorContext,
    FrontendMonitoringConfig,
    FrontendMonitoringProviderName,
    FrontendUserContext,
    IFrontendMonitoringProvider,
    UserActionBreadcrumb,
} from '@shared/types';

export class ConsoleFrontendProvider implements IFrontendMonitoringProvider {
    public readonly name: FrontendMonitoringProviderName = 'console';
    private sessionId: string = '';

    public init(config: FrontendMonitoringConfig): void {
        this.sessionId = `console_sess_${crypto.randomUUID().slice(0, 8)}`;
        if (process.env.NODE_ENV !== 'production') {
            console.warn(`[MailSense Monitoring] Initialized Console provider in environment: "${config.environment}"`);
        }
    }

    public captureException(error: Error, context?: FrontendErrorContext): void {
        console.error('[MailSense ErrorBoundary Captured]', {
            message: error.message,
            name: error.name,
            stack: error.stack,
            traceId: context?.traceId,
            route: context?.route,
            componentStack: context?.componentStack,
            recentBreadcrumbs: context?.breadcrumbs,
        });
    }

    public captureBreadcrumb(breadcrumb: UserActionBreadcrumb): void {
        if (process.env.NODE_ENV !== 'production') {
            const badge = `[Breadcrumb: ${breadcrumb.category}]`;
            console.warn(badge, breadcrumb.message, breadcrumb.data || '');
        }
    }

    public setUser(user: FrontendUserContext | null): void {
        if (process.env.NODE_ENV !== 'production' && user) {
            console.warn(`[MailSense Monitoring] Active User: ${user.email ?? user.id}`);
        }
    }

    public getSessionId(): string {
        return this.sessionId;
    }
}
