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

function extractTrimmedHeader(req: Request, headerName: string): string | undefined {
    const raw = req.header(headerName);
    if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if (trimmed.length > 0) {
            return trimmed;
        }
    }
    return undefined;
}

function extractUserNameHeader(req: Request): string | undefined {
    const raw = extractTrimmedHeader(req, 'x-user-name');
    if (!raw) return undefined;
    try {
        return decodeURIComponent(raw);
    } catch {
        return raw;
    }
}

function extractTraceId(req: Request): string {
    const raw = extractTrimmedHeader(req, 'x-trace-id') ?? extractTrimmedHeader(req, 'x-request-id');
    return raw || crypto.randomUUID();
}

function buildTraceStore(req: Request, traceId: string): TraceStore {
    const store: TraceStore = { traceId };
    const userId = extractTrimmedHeader(req, 'x-user-id');
    const userEmail = extractTrimmedHeader(req, 'x-user-email');
    const userName = extractUserNameHeader(req);
    const accountId = extractTrimmedHeader(req, 'x-account-id');

    if (userId) store.userId = userId;
    if (userEmail) store.userEmail = userEmail;
    if (userName) store.userName = userName;
    if (accountId) store.accountId = accountId;

    return store;
}

/**
 * Express middleware that initializes or extracts the traceId,
 * sets the outbound X-Trace-Id response header, and wraps the request in AsyncLocalStorage.
 */
export const traceMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const traceId = extractTraceId(req);
        res.setHeader('X-Trace-Id', traceId);

        const store = buildTraceStore(req, traceId);
        traceStorage.run(store, () => {
            next();
        });
    } catch {
        next();
    }
};
