import { ENV } from './env.js';

export const NODE_ENV = ENV.NODE_ENV;

export const PORT: number = ENV.PORT;

export const ENABLE_AUTH: boolean = ENV.ENABLE_AUTH;

export const LOG_LEVEL = ENV.LOG_LEVEL;

export const MONGODB_URI = ENV.MONGODB_URI;

export const config = {
    url: 'https://catfact.ninja',
    nodeEnv: ENV.NODE_ENV,
};
