export const FRONTEND_MONITORING_PROVIDERS = {
    CONSOLE: 'console',
    SENTRY: 'sentry',
} as const;

export const MONITORING_DEFAULTS = {
    MAX_BREADCRUMBS: 50,
    SESSION_STORAGE_KEY: 'mailsense_session_id',
} as const;

export const PRIVACY_MASK_SELECTORS = ['.tiptap', '.email-body', 'input[type="password"]', '[data-sensitive="true"]'] as const;

export const SENSITIVE_KEY_NAMES = ['password', 'token', 'accesstoken', 'refreshtoken', 'secret', 'authorization', 'cookie'] as const;
