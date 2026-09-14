export const HEALTH_PROBES_API_ENDPOINTS = ['/health', '/health/ready', '/testEndpoint', '/api/health', '/api/health/ready'] as const;

/**
 * Standardized module identifiers for structured application logging.
 * Replaces hardcoded string literals across services, clients, and workers.
 */
export enum LOGGER_MODULE {
    APP = 'App',
    SERVER = 'Server',
    DATABASE = 'Database',
    HTTP = 'HTTP',
    HEALTH_SERVICE = 'HealthService',
    HEALTH_CONTROLLER = 'HealthController',
    REDIS_CONNECTION = 'RedisConnection',
    QUEUE_SERVICE = 'QueueService',
    SCHEDULER_SERVICE = 'SchedulerService',
    QUEUE_REGISTRY = 'QueueRegistry',
    EVENT_BUS = 'EventBus',
    EMAIL_CREATED_HANDLER = 'EmailCreatedHandler',
    SYNC_COMPLETED_HANDLER = 'SyncCompletedHandler',
    MONITORING_MANAGER = 'MonitoringManager',
    SENTRY_PROVIDER = 'SentryProvider',
    NOOP_MONITORING_PROVIDER = 'NoopMonitoringProvider',
    GMAIL_CLIENT = 'GmailClient',
    GMAIL_SERVICE = 'GmailService',
    OUTLOOK_CLIENT = 'OutlookClient',
    OUTLOOK_SERVICE = 'OutlookService',
    AUTH0_CLIENT = 'Auth0Client',
    AUTH0_SERVICE = 'Auth0Service',
    OBJECT_STORAGE_SERVICE = 'ObjectStorageService',
    ACCOUNT_SERVICE = 'AccountService',
    EMAIL_SERVICE = 'EmailService',
    ATTACHMENT_SERVICE = 'AttachmentService',
    FOLDER_SERVICE = 'FolderService',
    DRAFT_SERVICE = 'DraftService',
    ANALYTICS_SERVICE = 'AnalyticsService',
    ANALYTICS_UTILS = 'AnalyticsUtils',
    BASE_WORKER = 'BaseWorker',
    SYNC_WORKER = 'SyncWorker',
    TOKEN_REFRESH_WORKER = 'TokenRefreshWorker',
    SYNC_ACCOUNT_PROCESSOR = 'SyncAccountProcessor',
    REFRESH_TOKEN_PROCESSOR = 'RefreshTokenProcessor',
    AUTH_MIDDLEWARE = 'AuthMiddleware',
}
