import z from 'zod';

export const envSchemaObject = {
    PORT: z.coerce.number().default(8020),
    ENABLE_AUTH: z.enum(['true', 'false']).default('true'),
    NODE_ENV: z.string().default('local'),
    MONGODB_URI: z.string(),
    DATABASE: z.string(),
    LOG_LEVEL: z.string().default('info'),
    ENCRYPTION_KEY: z.string(),
    MAILSENSE_BASE_URL: z.string(),
    // Auth0 secrets
    AUTH0_AUDIENCE: z.string(),
    AUTH0_ISSUER_BASE_URL: z.string(),
    // OAuth secrets
    GMAIL_CLIENT_ID: z.string(),
    GMAIL_CLIENT_SECRET: z.string(),
    GMAIL_REDIRECT_URI: z.string(),
    OUTLOOK_CLIENT_ID: z.string(),
    OUTLOOK_CLIENT_SECRET: z.string(),
    OUTLOOK_REDIRECT_URI: z.string(),
    // Jobs/Queues secrets
    REDIS_URL: z.string(),
    // Auth0 API Secrets
    AUTH0_API_CLIENT_ID: z.string(),
    AUTH0_API_CLIENT_SECRET: z.string(),
    AUTH0_API_BASE_URL: z.string(),
    SENTRY_DSN: z.string(),
    // Cloudflare R2 Storage Secrets
    R2_ACCOUNT_ID: z.string(),
    R2_ACCESS_KEY_ID: z.string(),
    R2_SECRET_ACCESS_KEY: z.string(),
    R2_BUCKET_NAME: z.string(),
    R2_REGION: z.string(),
};
