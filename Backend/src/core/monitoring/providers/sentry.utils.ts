import * as Sentry from '@sentry/node';
import { MonitoringUserContext, TraceStore } from '@types';

export const REDUNDANT_USER_KEYS = new Set([
    'userId',
    'user_id',
    'user.id',
    'userEmail',
    'user_email',
    'user.email',
    'userName',
    'user_name',
    'user.username',
]);

export function omitUserKeys(data?: Record<string, string | number | boolean>): Record<string, string | number | boolean> {
    if (!data) return {};
    const result: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(data)) {
        if (!REDUNDANT_USER_KEYS.has(key)) {
            result[key] = value;
        }
    }
    return result;
}

export function findStringProperty(data: Record<string, string | number | boolean>, ...keys: string[]): string | undefined {
    for (const key of keys) {
        const val = data[key];
        if (typeof val === 'string' && val.length > 0) {
            return val;
        }
    }
    return undefined;
}

export function extractUserId(
    override?: Partial<MonitoringUserContext>,
    trace?: TraceStore,
    isolationUser?: Sentry.User,
): string | undefined {
    const rawId = override?.id ?? trace?.userId ?? isolationUser?.id;
    return rawId ? String(rawId) : undefined;
}

export function extractUserEmail(
    override?: Partial<MonitoringUserContext>,
    trace?: TraceStore,
    isolationUser?: Sentry.User,
): string | undefined {
    return override?.email ?? trace?.userEmail ?? isolationUser?.email ?? undefined;
}

export function extractUserUsername(
    override?: Partial<MonitoringUserContext>,
    trace?: TraceStore,
    isolationUser?: Sentry.User,
): string | undefined {
    return override?.username ?? trace?.userName ?? isolationUser?.username ?? undefined;
}

export function extractUserIp(
    override?: Partial<MonitoringUserContext>,
    isolationUser?: Sentry.User,
): string | undefined {
    return override?.ipAddress ?? isolationUser?.ip_address ?? undefined;
}

export function extractOverrideUserFromData(
    data?: Record<string, string | number | boolean>,
): Partial<MonitoringUserContext> | undefined {
    if (!data) return undefined;
    const id = findStringProperty(data, 'userId', 'user.id', 'id');
    const email = findStringProperty(data, 'userEmail', 'user.email', 'email');
    const username = findStringProperty(data, 'userName', 'user.username', 'username');

    if (!id && !email && !username) return undefined;
    return { id, email, username };
}

