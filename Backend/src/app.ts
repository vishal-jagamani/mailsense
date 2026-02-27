import cors from 'cors';
import express, { Application, NextFunction, Request, Response } from 'express';
import path from 'path';
import * as Sentry from '@sentry/node';

import { apiErrorHandler, errorHandler } from '@middlewares/error.handler.js';
import indexRoutes from '@routes/index.routes.js';
import { MAILSENSE_BASE_URL } from '@config/config.js';

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
        // Enable cors for all routes
        this.expressApp.use(cors({ origin: ['http://localhost:3000', MAILSENSE_BASE_URL], credentials: true }));

        // Parse JSON and URL encoded request body
        this.expressApp.use(express.json());
        this.expressApp.use(express.urlencoded({ extended: true }));

        // Serve static files
        this.expressApp.use(express.static(path.join(this.__dirname, '/')));
    }

    private setupRoutes(): void {
        // Test endpoint
        this.expressApp.get('/testEndpoint', (req: Request, res: Response) => {
            res.send(`MailSense Backend Test Endpoint`);
        });

        this.expressApp.use('/api', indexRoutes);
    }

    private setupNotFoundHandler(): void {
        // Handle 404 errors
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        this.expressApp.use((req: Request, res: Response, next: NextFunction) => {
            res.status(404).send({
                error: {
                    code: 404,
                    message: 'Not Found',
                    description: 'The requested resource was not found on the server.',
                    suggestedAction: 'Check the resource URL or verify that the resource exists.',
                },
            });
        });
    }

    private setupErrorHandler(): void {
        this.expressApp.use(Sentry.expressErrorHandler());
        // Centralized error handler
        this.expressApp.use(apiErrorHandler);
        this.expressApp.use(errorHandler);
    }
}
