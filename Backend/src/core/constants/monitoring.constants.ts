export const MONITORING_PROVIDERS = {
    SENTRY: 'sentry',
    NEW_RELIC: 'newrelic',
    NOOP: 'noop',
} as const;

export const DEFAULT_MONITORING_CONFIG = {
    DEFAULT_PROVIDER: MONITORING_PROVIDERS.NOOP,
    DEFAULT_SAMPLE_RATE: 1.0,
    DEFAULT_SEND_DEFAULT_PII: true,
} as const;
