import { MONITORING_DEFAULTS, SENSITIVE_KEY_NAMES } from '@shared/constants';
import { BreadcrumbCategory, BreadcrumbLevel, UserActionBreadcrumb } from '@shared/types';

export class SessionTracker {
    private static instance: SessionTracker | null = null;
    private breadcrumbs: UserActionBreadcrumb[] = [];
    private readonly maxBreadcrumbs: number;
    private sessionId: string;

    private constructor(maxBreadcrumbs: number = MONITORING_DEFAULTS.MAX_BREADCRUMBS) {
        this.maxBreadcrumbs = maxBreadcrumbs;
        this.sessionId = this.resolveSessionId();
    }

    public static getInstance(): SessionTracker {
        if (!SessionTracker.instance) {
            SessionTracker.instance = new SessionTracker();
        }
        return SessionTracker.instance;
    }

    private resolveSessionId(): string {
        try {
            if (typeof window !== 'undefined' && window.sessionStorage) {
                const existing = window.sessionStorage.getItem(MONITORING_DEFAULTS.SESSION_STORAGE_KEY);
                if (existing) {
                    return existing;
                }
                const newId = `sess_${crypto.randomUUID()}`;
                window.sessionStorage.setItem(MONITORING_DEFAULTS.SESSION_STORAGE_KEY, newId);
                return newId;
            }
        } catch {
            // Fallback if sessionStorage is restricted in iframe/private mode
        }
        return `sess_${crypto.randomUUID()}`;
    }

    public getSessionId(): string {
        return this.sessionId;
    }

    /**
     * Sanitizes sensitive properties from data payloads before recording
     */
    private sanitizeData(data?: Record<string, string | number | boolean>): Record<string, string | number | boolean> | undefined {
        try {
            if (!data) return undefined;

            const sanitized: Record<string, string | number | boolean> = {};
            for (const [key, value] of Object.entries(data)) {
                const lowerKey = key.toLowerCase();
                const isSensitive = SENSITIVE_KEY_NAMES.some((sensitiveName) => lowerKey.includes(sensitiveName));
                if (isSensitive) {
                    sanitized[key] = '[Filtered]';
                } else {
                    sanitized[key] = value;
                }
            }
            return sanitized;
        } catch {
            return undefined;
        }
    }

    public addBreadcrumb(
        category: BreadcrumbCategory,
        message: string,
        level: BreadcrumbLevel = 'info',
        data?: Record<string, string | number | boolean>,
    ): void {
        try {
            const cleanData = this.sanitizeData(data);
            const breadcrumb: UserActionBreadcrumb = {
                category,
                message,
                level,
                timestamp: Date.now(),
                data: cleanData,
            };

            this.breadcrumbs.push(breadcrumb);

            if (this.breadcrumbs.length > this.maxBreadcrumbs) {
                this.breadcrumbs.shift();
            }
        } catch {
            // Non-blocking
        }
    }

    public getRecentBreadcrumbs(): UserActionBreadcrumb[] {
        try {
            return [...this.breadcrumbs];
        } catch {
            return [];
        }
    }

    public clear(): void {
        this.breadcrumbs = [];
    }
}

export const sessionTracker = SessionTracker.getInstance();
