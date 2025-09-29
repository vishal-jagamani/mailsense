import dotenv from 'dotenv';
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
    // OAuth secrets
    public readonly GMAIL_CLIENT_ID: string;
    public readonly GMAIL_CLIENT_SECRET: string;
    public readonly GMAIL_REDIRECT_URI: string;
    public readonly OUTLOOK_CLIENT_ID: string;
    public readonly OUTLOOK_CLIENT_SECRET: string;
    public readonly OUTLOOK_REDIRECT_URI: string;
    // Jobs/Queues secrets
    public readonly REDIS_HOST: string;
    public readonly REDIS_PORT: number;
    public readonly REDIS_PASSWORD: string;

    constructor() {
        dotenv?.config();
        if (process.env.NODE_ENV === 'local') {
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
            // OAuth secrets
            GMAIL_CLIENT_ID: z.string(),
            GMAIL_CLIENT_SECRET: z.string(),
            GMAIL_REDIRECT_URI: z.string(),
            OUTLOOK_CLIENT_ID: z.string(),
            OUTLOOK_CLIENT_SECRET: z.string(),
            OUTLOOK_REDIRECT_URI: z.string(),
            // Jobs/Queues secrets
            REDIS_HOST: z.string(),
            REDIS_PORT: z.coerce.number().default(6379),
            REDIS_PASSWORD: z.string(),
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
        // OAuth secrets
        this.GMAIL_CLIENT_ID = data.GMAIL_CLIENT_ID;
        this.GMAIL_CLIENT_SECRET = data.GMAIL_CLIENT_SECRET;
        this.GMAIL_REDIRECT_URI = data.GMAIL_REDIRECT_URI;
        this.OUTLOOK_CLIENT_ID = data.OUTLOOK_CLIENT_ID;
        this.OUTLOOK_CLIENT_SECRET = data.OUTLOOK_CLIENT_SECRET;
        this.OUTLOOK_REDIRECT_URI = data.OUTLOOK_REDIRECT_URI;
        // Jobs/Queues secrets
        this.REDIS_HOST = data.REDIS_HOST;
        this.REDIS_PORT = data.REDIS_PORT;
        this.REDIS_PASSWORD = data.REDIS_PASSWORD;
    }
}

export const ENV = new EnvConfig();
