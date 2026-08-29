import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

class EnvConfig {
    public readonly PORT: number;
    public readonly ENABLE_AUTH: boolean;
    public readonly NODE_ENV: string;
    public readonly MONGODB_URI: string;
    public readonly DATABASE: string;
    public readonly LOG_LEVEL: string;
    public readonly ENCRYPTION_KEY: string;
    public readonly MAILSENSE_BASE_URL: string;
    // Auth0 secrets
    public readonly AUTH0_AUDIENCE: string;
    public readonly AUTH0_ISSUER_BASE_URL: string;
    // OAuth secrets
    public readonly GMAIL_CLIENT_ID: string;
    public readonly GMAIL_CLIENT_SECRET: string;
    public readonly GMAIL_REDIRECT_URI: string;
    public readonly OUTLOOK_CLIENT_ID: string;
    public readonly OUTLOOK_CLIENT_SECRET: string;
    public readonly OUTLOOK_REDIRECT_URI: string;
    // Jobs/Queues secrets
    public readonly REDIS_URL: string;
    // Auth0 API Secrets
    public readonly AUTH0_API_CLIENT_ID: string;
    public readonly AUTH0_API_CLIENT_SECRET: string;
    public readonly AUTH0_API_BASE_URL: string;
    public readonly SENTRY_DSN: string;
    // Cloudflare R2 Storage Secrets
    public readonly R2_ACCOUNT_ID: string;
    public readonly R2_ACCESS_KEY_ID: string;
    public readonly R2_SECRET_ACCESS_KEY: string;
    public readonly R2_BUCKET_NAME: string;
    public readonly R2_REGION: string;

    constructor() {
        dotenv?.config();
        if (process.env.NODE_ENV) {
            const envFilePath = path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`);
            if (fs.existsSync(envFilePath)) {
                dotenv.config({ path: envFilePath });
            } else if (process.env.NODE_ENV === 'test') {
                const fallbackPath = path.resolve(process.cwd(), '.env.local');
                dotenv.config({ path: fallbackPath });
            } else {
                dotenv.config({ path: envFilePath });
            }
        } else {
            const envFilePath = path.resolve(process.cwd(), `.env.local`);
            dotenv.config({ path: envFilePath });
        }

        const schema = z.object({
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
        });

        const result = schema.safeParse(process.env);
        if (!result.success) {
            console.error('❌ Invalid environment variables:', z.flattenError(result.error));
            process.exit(1);
        }

        const data = result.data;
        this.PORT = data.PORT;
        this.ENABLE_AUTH = data.ENABLE_AUTH === 'true';
        this.NODE_ENV = data.NODE_ENV;
        this.MONGODB_URI = data.MONGODB_URI;
        this.DATABASE = data.DATABASE;
        this.LOG_LEVEL = data.LOG_LEVEL;
        this.ENCRYPTION_KEY = data.ENCRYPTION_KEY;
        this.MAILSENSE_BASE_URL = data.MAILSENSE_BASE_URL;
        // Auth0 secrets
        this.AUTH0_AUDIENCE = data.AUTH0_AUDIENCE;
        this.AUTH0_ISSUER_BASE_URL = data.AUTH0_ISSUER_BASE_URL;
        // OAuth secrets
        this.GMAIL_CLIENT_ID = data.GMAIL_CLIENT_ID;
        this.GMAIL_CLIENT_SECRET = data.GMAIL_CLIENT_SECRET;
        this.GMAIL_REDIRECT_URI = data.GMAIL_REDIRECT_URI;
        this.OUTLOOK_CLIENT_ID = data.OUTLOOK_CLIENT_ID;
        this.OUTLOOK_CLIENT_SECRET = data.OUTLOOK_CLIENT_SECRET;
        this.OUTLOOK_REDIRECT_URI = data.OUTLOOK_REDIRECT_URI;
        // Jobs/Queues secrets
        this.REDIS_URL = data.REDIS_URL;
        // Auth0 API secrets
        this.AUTH0_API_CLIENT_ID = data.AUTH0_API_CLIENT_ID;
        this.AUTH0_API_CLIENT_SECRET = data.AUTH0_API_CLIENT_SECRET;
        this.AUTH0_API_BASE_URL = data.AUTH0_API_BASE_URL;
        this.SENTRY_DSN = data.SENTRY_DSN;
        // Cloudflare R2 Storage Secrets
        this.R2_ACCOUNT_ID = data.R2_ACCOUNT_ID;
        this.R2_ACCESS_KEY_ID = data.R2_ACCESS_KEY_ID;
        this.R2_SECRET_ACCESS_KEY = data.R2_SECRET_ACCESS_KEY;
        this.R2_BUCKET_NAME = data.R2_BUCKET_NAME;
        this.R2_REGION = data.R2_REGION;
    }
}

export const ENV = new EnvConfig();
