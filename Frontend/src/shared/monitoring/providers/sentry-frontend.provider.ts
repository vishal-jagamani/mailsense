import type { SeverityLevel } from '@sentry/nextjs';
import * as Sentry from '@sentry/nextjs';
import {
    BreadcrumbLevel,
    FrontendErrorContext,
    FrontendMonitoringConfig,
    FrontendMonitoringProviderName,
    FrontendUserContext,
    IFrontendMonitoringProvider,
    UserActionBreadcrumb,
} from '@shared/types';

export class SentryFrontendProvider implements IFrontendMonitoringProvider {
    public readonly name: FrontendMonitoringProviderName = 'sentry';
    private initialized = false;
    private sessionId = '';

    public init(config: FrontendMonitoringConfig): void {
        try {
            if (this.initialized) return;

            const dsn = config.dsn || process.env.NEXT_PUBLIC_SENTRY_DSN;
            if (!dsn) {
                console.warn('[SentryFrontendProvider] Sentry DSN not configured, skipping initialization.');
                return;
            }

            this.sessionId = `sentry_sess_${crypto.randomUUID().slice(0, 8)}`;

            // Initialize Sentry client
            if (!Sentry.getClient()) {
                Sentry.init({
                    dsn,
                    environment: config.environment || process.env.NODE_ENV || 'development',
                    release: config.release || '3.2.0',
                });
            }

            this.initialized = true;
        } catch (err) {
            console.error('[SentryFrontendProvider] Failed to initialize Sentry:', err);
        }
    }

    public captureException(error: Error, context?: FrontendErrorContext): void {
        try {
            if (!this.initialized) return;

            Sentry.withScope((scope) => {
                if (context?.traceId) {
                    scope.setTag('traceId', context.traceId);
                }
                if (context?.route) {
                    scope.setTag('route', context.route);
                }
                if (context?.componentStack) {
                    scope.setExtra('componentStack', context.componentStack);
                }
                if (context?.extra) {
                    for (const [key, value] of Object.entries(context.extra)) {
                        scope.setExtra(key, value);
                    }
                }
                if (context?.breadcrumbs) {
                    for (const b of context.breadcrumbs) {
                        scope.addBreadcrumb({
                            category: b.category,
                            message: b.message,
                            level: b.level as SeverityLevel,
                            data: b.data,
                            timestamp: b.timestamp ? b.timestamp / 1000 : undefined,
                        });
                    }
                }
                Sentry.captureException(error);
            });
        } catch (captureErr) {
            console.error('[SentryFrontendProvider] Error capturing exception:', captureErr);
        }
    }

    public captureBreadcrumb(breadcrumb: UserActionBreadcrumb): void {
        try {
            if (!this.initialized) return;

            Sentry.addBreadcrumb({
                category: breadcrumb.category,
                message: breadcrumb.message,
                level: breadcrumb.level as SeverityLevel,
                data: breadcrumb.data,
                timestamp: breadcrumb.timestamp ? breadcrumb.timestamp / 1000 : undefined,
            });
        } catch {
            // Non-blocking
        }
    }

    public setUser(user: FrontendUserContext | null): void {
        try {
            if (!this.initialized) return;

            if (user) {
                Sentry.setUser({
                    id: user.id,
                    email: user.email,
                    username: user.username,
                });
            } else {
                Sentry.setUser(null);
            }
        } catch {
            // Non-blocking
        }
    }

    public getSessionId(): string {
        return this.sessionId;
    }
}
