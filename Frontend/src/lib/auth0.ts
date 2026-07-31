import { Auth0Client } from '@auth0/nextjs-auth0/server';

const domain = process.env.AUTH0_DOMAIN?.replace(/^https?:\/\//, '');

export const auth0 = new Auth0Client({
    ...(domain ? { domain } : {}),
    authorizationParameters: {
        scope: process.env.AUTH0_SCOPE,
        audience: process.env.AUTH0_AUDIENCE,
    },
});
