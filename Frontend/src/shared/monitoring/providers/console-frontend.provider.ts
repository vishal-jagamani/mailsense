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
        try {
            this.sessionId = `console_sess_${crypto.randomUUID().slice(0, 8)}`;
            if (process.env.NODE_ENV !== 'production') {
                console.info(`[MailSense Monitoring] Initialized Console provider in environment: "${config.environment}"`);
            }
        } catch {
            // Non-blocking
        }
    }

    public captureException(error: Error, context?: FrontendErrorContext): void {
        try {
            console.error('[MailSense ErrorBoundary Captured]', {
                message: error.message,
                name: error.name,
                stack: error.stack,
                traceId: context?.traceId,
                route: context?.route,
                componentStack: context?.componentStack,
                recentBreadcrumbs: context?.breadcrumbs,
            });
        } catch {
            // Non-blocking
        }
    }

    public captureBreadcrumb(breadcrumb: UserActionBreadcrumb): void {
        try {
            if (process.env.NODE_ENV !== 'production') {
                const badge = `[Breadcrumb: ${breadcrumb.category}]`;
                console.debug(badge, breadcrumb.message, breadcrumb.data || '');
            }
        } catch {
            // Non-blocking
        }
    }

    public setUser(user: FrontendUserContext | null): void {
        try {
            if (process.env.NODE_ENV !== 'production' && user) {
                console.info(`[MailSense Monitoring] Active User: ${user.email ?? user.id}`);
            }
        } catch {
            // Non-blocking
        }
    }

    public getSessionId(): string {
        return this.sessionId;
    }
}
