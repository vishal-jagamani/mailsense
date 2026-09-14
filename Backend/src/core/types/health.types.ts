export type HealthStatusValue = 'healthy' | 'unhealthy';
export type DependencyStatusValue = 'up' | 'down';

export interface LivenessResponse {
    status: HealthStatusValue;
    uptime: number;
    timestamp: string;
}

export interface DependencyCheckDetails {
    status: DependencyStatusValue;
    latencyMs?: number;
    error?: string;
}

export interface ReadinessChecks {
    mongodb: DependencyStatusValue;
    redis: DependencyStatusValue;
}

export interface ReadinessResponse {
    status: HealthStatusValue;
    checks: ReadinessChecks;
    timestamp: string;
    details?: {
        mongodb?: DependencyCheckDetails;
        redis?: DependencyCheckDetails;
    };
}
