import { TraceStore } from '@types';
import { NextFunction, Request, Response } from 'express';
import { AsyncLocalStorage } from 'node:async_hooks';

const traceStorage = new AsyncLocalStorage<TraceStore>();

export function getTraceStore(): TraceStore | undefined {
    return traceStorage.getStore();
}

export const getTraceId = (): string => {
    return traceStorage.getStore()?.traceId ?? '';
};

export const getTraceUserId = (): string | undefined => {
    return traceStorage.getStore()?.userId;
};

export const setTraceContext = (context: Partial<TraceStore>): void => {
    const store = traceStorage.getStore();
    if (store) {
        if (context.userId) store.userId = context.userId;
        if (context.userEmail) store.userEmail = context.userEmail;
        if (context.userName) store.userName = context.userName;
        if (context.accountId) store.accountId = context.accountId;
    }
};

export const runWithTrace = <T>(store: TraceStore, fn: () => Promise<T>): Promise<T> => {
    return traceStorage.run(store, fn);
};

/**
 * Express middleware that initializes or extracts the traceId,
 * sets the outbound X-Trace-Id response header, and wraps the request in AsyncLocalStorage.
 */
export const traceMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const rawHeader = req.header('x-trace-id') || req.header('x-request-id');
        const incomingTraceId = typeof rawHeader === 'string' ? rawHeader.trim() : undefined;
        const traceId = incomingTraceId && incomingTraceId.length > 0 ? incomingTraceId : crypto.randomUUID();

        const rawUserId = req.header('x-user-id');
        const incomingUserId = typeof rawUserId === 'string' && rawUserId.trim().length > 0 ? rawUserId.trim() : undefined;

        const rawUserEmail = req.header('x-user-email');
        const incomingUserEmail = typeof rawUserEmail === 'string' && rawUserEmail.trim().length > 0 ? rawUserEmail.trim() : undefined;

        const rawUserName = req.header('x-user-name');
        let incomingUserName: string | undefined;
        if (typeof rawUserName === 'string' && rawUserName.trim().length > 0) {
            try {
                incomingUserName = decodeURIComponent(rawUserName.trim());
            } catch {
                incomingUserName = rawUserName.trim();
            }
        }

        const rawAccountId = req.header('x-account-id');
        const incomingAccountId = typeof rawAccountId === 'string' && rawAccountId.trim().length > 0 ? rawAccountId.trim() : undefined;

        // Propagate traceId back to client
        res.setHeader('X-Trace-Id', traceId);

        const store: TraceStore = {
            traceId,
            ...(incomingUserId ? { userId: incomingUserId } : {}),
            ...(incomingUserEmail ? { userEmail: incomingUserEmail } : {}),
            ...(incomingUserName ? { userName: incomingUserName } : {}),
            ...(incomingAccountId ? { accountId: incomingAccountId } : {}),
        };

        traceStorage.run(store, () => {
            next();
        });
        // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (error) {
        next();
    }
};
