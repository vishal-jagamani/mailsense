import express, { Request, Response } from 'express';
import request from 'supertest';
import { errorHandler } from '../../../middlewares/error.handler.js';
import { syncRateLimiter } from '../rate-limit.config.js';

describe('Rate Limiter Middleware', () => {
    let app: express.Application;

    beforeEach(() => {
        app = express();
        app.use(express.json());

        // Test route with syncRateLimiter (limit: 5 requests)
        app.get('/test-sync', syncRateLimiter, (_req: Request, res: Response) => {
            res.status(200).json({ status: true, message: 'Sync triggered' });
        });

        app.use(errorHandler);
    });

    it('should allow requests within the rate limit threshold', async () => {
        for (let i = 0; i < 5; i++) {
            const res = await request(app).get('/test-sync');
            expect(res.status).toBe(200);
            expect(res.body.status).toBe(true);
        }
    });

    it('should reject requests exceeding threshold with HTTP 429 and standard AppError shape', async () => {
        for (let i = 0; i < 5; i++) {
            await request(app).get('/test-sync');
        }

        const blockedRes = await request(app).get('/test-sync');
        expect(blockedRes.status).toBe(429);
        expect(blockedRes.body.status).toBe(false);
        expect(blockedRes.body.error).toBeDefined();
        expect(blockedRes.body.error.code).toBe(429);
        expect(blockedRes.body.error.errorCode).toBe('PROVIDER_RATE_LIMITED');
        expect(blockedRes.body.error.description).toContain('maximum allowed API request quota');
    });
});
