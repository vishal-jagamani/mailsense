import { RateLimitError } from '@errors';
import { NextFunction, Request, Response } from 'express';
import { rateLimit, RateLimitRequestHandler } from 'express-rate-limit';

/**
 * Extracts unique client key: authenticated user ID or fallback IP address.
 */
const resolveClientKey = (req: Request): string => {
    try {
        const userId = req.user?.id;
        if (userId) {
            return `user:${userId}`;
        }
        return `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
    } catch {
        return 'ip:unknown';
    }
};

/**
 * Custom 429 handler delegating directly into AppError / errorHandler middleware.
 */
const createRateLimitHandler = (bucketName: string, retryAfterSeconds: number) => {
    return (_req: Request, _res: Response, next: NextFunction): void => {
        try {
            const error = new RateLimitError(bucketName, retryAfterSeconds * 1000);
            next(error);
        } catch (err) {
            next(err);
        }
    };
};

/**
 * General API Limiter: 300 requests per 15 minutes per client
 */
export const defaultApiRateLimiter: RateLimitRequestHandler = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: resolveClientKey,
    handler: createRateLimitHandler('API', 900),
});

/**
 * Manual Account Sync Limiter: 5 sync requests per 1 minute per client
 */
export const syncRateLimiter: RateLimitRequestHandler = rateLimit({
    windowMs: 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: resolveClientKey,
    handler: createRateLimitHandler('Account Sync', 60),
});

/**
 * Transactional Compose Limiter: 20 compose requests per 1 minute per client
 */
export const composeRateLimiter: RateLimitRequestHandler = rateLimit({
    windowMs: 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: resolveClientKey,
    handler: createRateLimitHandler('Email Compose', 60),
});

/**
 * Authentication / Connect Limiter: 10 requests per 1 minute per client
 */
export const authRateLimiter: RateLimitRequestHandler = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: resolveClientKey,
    handler: createRateLimitHandler('Authentication', 60),
});
