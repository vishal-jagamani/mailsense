export const HEALTH_STATUS = {
    HEALTHY: 'healthy',
    UNHEALTHY: 'unhealthy',
} as const;

export const DEPENDENCY_STATUS = {
    UP: 'up',
    DOWN: 'down',
} as const;

export const HEALTH_CHECK_CONFIG = {
    PING_TIMEOUT_MS: 2000,
} as const;
