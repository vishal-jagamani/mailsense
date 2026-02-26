import * as Sentry from '@sentry/node';
import process from 'node:process';

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    sendDefaultPii: true,
});
