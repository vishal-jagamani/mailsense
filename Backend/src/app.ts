import { MAILSENSE_BASE_URL } from '@config';
import { healthRoutes } from '@health';
import { errorHandler } from '@middlewares';
import { createHelmetMiddleware, defaultApiRateLimiter } from '@security';
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import path from 'path';
import indexRoutes from 'routes.js';
import { requestLoggerMiddleware, traceMiddleware } from './core/observability/index.js';

export class App {
    public expressApp: Application;
    private __dirname: string;

    constructor() {
        this.expressApp = express();
        this.__dirname = process.cwd();

        this.setupMiddleware();
        this.setupRoutes();
        this.setupNotFoundHandler();
        this.setupErrorHandler();
    }

    private setupMiddleware(): void {
        // 1. Mount distributed tracing middleware first
        this.expressApp.use(traceMiddleware);

        // 2. Mount Helmet HTTP security headers
        this.expressApp.use(createHelmetMiddleware());

        // 3. Mount request logger middleware
        this.expressApp.use(requestLoggerMiddleware);

        // 4. Enable cors for verified origins
        this.expressApp.use(cors({ origin: ['http://localhost:3000', MAILSENSE_BASE_URL], credentials: true }));

        // 5. Parse JSON and URL encoded request bodies
        this.expressApp.use(express.json());
        this.expressApp.use(express.urlencoded({ extended: true }));

        // 6. Serve static files
        this.expressApp.use(express.static(path.join(this.__dirname, '/')));
    }

    private setupRoutes(): void {
        // Mount health probes at both root and /api for cloud orchestrator compatibility
        this.expressApp.use(healthRoutes);
        this.expressApp.use('/api', healthRoutes);

        this.expressApp.get('/testEndpoint', (_req: Request, res: Response) => {
            res.send(`MailSense Backend Test Endpoint`);
        });

        this.expressApp.use('/api', defaultApiRateLimiter, indexRoutes);
    }

    private setupNotFoundHandler(): void {
        this.expressApp.use((_req: Request, res: Response) => {
            res.status(404).json({
                status: false,
                message: 'Resource not found',
                error: {
                    code: 404,
                    errorCode: 'RESOURCE_NOT_FOUND',
                    traceId: '',
                    description: 'The requested endpoint does not exist on the server.',
                    suggestedAction: 'Verify the request URL and HTTP method.',
                },
            });
        });
    }

    private setupErrorHandler(): void {
        this.expressApp.use(errorHandler);
    }
}
