export type FrontendMonitoringProviderName = 'console' | 'sentry';

export type BreadcrumbCategory = 'navigation' | 'ui.click' | 'api.request' | 'api.response' | 'api.error' | 'mutation' | 'session';

export type BreadcrumbLevel = 'info' | 'warn' | 'error' | 'debug';

export interface UserActionBreadcrumb {
    category: BreadcrumbCategory;
    message: string;
    level?: BreadcrumbLevel;
    timestamp: number;
    data?: Record<string, string | number | boolean>;
}

export interface FrontendUserContext {
    id: string;
    email?: string;
    username?: string;
}

export interface FrontendErrorContext {
    traceId?: string;
    componentStack?: string;
    route?: string;
    breadcrumbs?: UserActionBreadcrumb[];
    extra?: Record<string, string | number | boolean>;
}

export interface FrontendMonitoringConfig {
    provider: FrontendMonitoringProviderName;
    dsn?: string;
    environment: string;
    release?: string;
    maxBreadcrumbs?: number;
    maskSelectors?: string[];
}

export interface IFrontendMonitoringProvider {
    readonly name: FrontendMonitoringProviderName;
    init(config: FrontendMonitoringConfig): void;
    captureException(error: Error, context?: FrontendErrorContext): void;
    captureBreadcrumb(breadcrumb: UserActionBreadcrumb): void;
    setUser(user: FrontendUserContext | null): void;
    getSessionId(): string;
}
