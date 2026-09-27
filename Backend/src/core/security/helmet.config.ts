import { RequestHandler } from 'express';
import helmet from 'helmet';

/**
 * Standardized Helmet security headers and Content Security Policy configuration.
 */
export const createHelmetMiddleware = (): RequestHandler => {
    return helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ['\'self\''],
                scriptSrc: ['\'self\''],
                styleSrc: ['\'self\'', '\'unsafe-inline\''],
                imgSrc: ['\'self\'', 'data:', 'https:'],
                connectSrc: ['\'self\'', 'https:'],
                fontSrc: ['\'self\'', 'https:', 'data:'],
                objectSrc: ['\'none\''],
                mediaSrc: ['\'self\''],
                frameAncestors: ['\'none\''],
                upgradeInsecureRequests: [],
            },
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        frameguard: { action: 'deny' },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
        },
        noSniff: true,
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    });
};
