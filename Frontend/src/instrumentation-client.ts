import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
    Sentry.init({
        dsn: SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        release: process.env.NEXT_PUBLIC_APP_VERSION || '3.8.0',
        tracesSampleRate: 1.0,
        debug: false,
    });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
