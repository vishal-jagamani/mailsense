import express, { Request, Response } from 'express';
import request from 'supertest';
import { createHelmetMiddleware } from '../helmet.config.js';

describe('Helmet Security Headers Middleware', () => {
    let app: express.Application;

    beforeEach(() => {
        app = express();
        app.use(createHelmetMiddleware());
        app.get('/test-headers', (_req: Request, res: Response) => {
            res.status(200).send('OK');
        });
    });

    it('should enforce security headers on all responses', async () => {
        const res = await request(app).get('/test-headers');

        expect(res.status).toBe(200);
        expect(res.headers['x-frame-options']).toBe('DENY');
        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.headers['strict-transport-security']).toContain('max-age=31536000');
        expect(res.headers['content-security-policy']).toBeDefined();
        expect(res.headers['content-security-policy']).toContain('default-src \'self\'');
    });
});
