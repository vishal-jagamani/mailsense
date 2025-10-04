import { ENV } from './env.js';

export const NODE_ENV = ENV.NODE_ENV;

export const PORT: number = ENV.PORT;

export const ENABLE_AUTH: boolean = ENV.ENABLE_AUTH;

export const LOG_LEVEL = ENV.LOG_LEVEL;

export const ENCRYPTION_KEY = ENV.ENCRYPTION_KEY;

export const MAILSENSE_BASE_URL = ENV.MAILSENSE_BASE_URL;

export const MONGODB_URI = ENV.MONGODB_URI;

export const DATABASE = ENV.DATABASE;

export const config = {
    url: 'https://catfact.ninja',
    nodeEnv: ENV.NODE_ENV,
};

export const AUTH0_SECRETS = {
    audience: ENV.AUTH0_AUDIENCE,
    issuerBaseURL: ENV.AUTH0_ISSUER_BASE_URL,
};

export const GMAIL_SECRETS = {
    client_id: ENV.GMAIL_CLIENT_ID,
    client_secret: ENV.GMAIL_CLIENT_SECRET,
    redirect_uri: ENV.GMAIL_REDIRECT_URI,
};

export const OUTLOOK_SECRETS = {
    client_id: ENV.OUTLOOK_CLIENT_ID,
    client_secret: ENV.OUTLOOK_CLIENT_SECRET,
    redirect_uri: ENV.OUTLOOK_REDIRECT_URI,
};

export const REDIS_CONFIG = {
    host: ENV.REDIS_HOST,
    port: ENV.REDIS_PORT,
    password: ENV.REDIS_PASSWORD,
};
