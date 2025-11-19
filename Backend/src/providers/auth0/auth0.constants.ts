import { AUTH0_API_SECRETS } from '@config/config.js';

export const AUTH0_API_AUDIENCE = `${AUTH0_API_SECRETS.baseUrl}/api/v2/`;

export const AUTH0_API_TOKEN_URI = `${AUTH0_API_SECRETS.baseUrl}/oauth/token`;

export const AUTH0_APIs = {
    getUserDetails: `${AUTH0_API_SECRETS.baseUrl}/api/v2/users`,
};
