import { ENV } from './env.js';

export const PORT: number = ENV.PORT;

export const ENABLE_AUTH: boolean = ENV.ENABLE_AUTH;

export const config = {
    url: 'https://catfact.ninja',
    nodeEnv: ENV.NODE_ENV,
};
