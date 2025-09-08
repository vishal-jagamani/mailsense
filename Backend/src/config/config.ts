import { ENV } from './env';

export const PORT: number = ENV.PORT;

export const ENABLE_AUTH: boolean = ENV.ENABLE_AUTH;

export const config = {
    url: 'https://catfact.ninja',
    nodeEnv: ENV.NODE_ENV,
};

console.log(PORT, ENABLE_AUTH, config);
