import { AUTH0_API_SECRETS } from '@config/config.js';
import { UserDetailsObject } from '@modules/user/user.types.js';
import { apiRequest } from '@utils/axios.js';
import { logger } from '@utils/logger.js';
import { AxiosRequestConfig } from 'axios';
import { AUTH0_API_AUDIENCE, AUTH0_API_TOKEN_URI, AUTH0_APIs } from './auth0.constants.js';
import { Auth0AccessTokenResponse, Auth0UserDetailsResponse } from './auth0.types.js';
import { UpdateUserSchema } from '@modules/user/user.schema.js';
import * as Sentry from '@sentry/node';

export class Auth0Api {
    private async fetchAccessToken(): Promise<Auth0AccessTokenResponse> {
        try {
            const options: AxiosRequestConfig = {
                url: AUTH0_API_TOKEN_URI,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                data: {
                    client_id: AUTH0_API_SECRETS.clientId,
                    client_secret: AUTH0_API_SECRETS.clientSecret,
                    audience: AUTH0_API_AUDIENCE,
                    grant_type: 'client_credentials',
                },
            };
            const response = await apiRequest<Auth0AccessTokenResponse>(options);
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Error in Auth0Api.fetchAccessToken: ${errorMessage}`, { error });
            throw error;
        }
    }

    public async getUserDetails(auth0UserId: string): Promise<Auth0UserDetailsResponse> {
        try {
            const accessToken = await this.fetchAccessToken();
            const options: AxiosRequestConfig = {
                url: `${AUTH0_APIs.getUserDetails}/${auth0UserId}`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken.access_token}`,
                },
            };
            const response = await apiRequest<Auth0UserDetailsResponse>(options);
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Error in Auth0Api.getUserDetails: ${errorMessage}`, { error });
            Sentry.captureException(error);
            throw error;
        }
    }

    public async updateUserDetails(auth0UserId: string, user: UpdateUserSchema): Promise<UserDetailsObject> {
        try {
            const accessToken = await this.fetchAccessToken();
            const options: AxiosRequestConfig = {
                url: `${AUTH0_APIs.getUserDetails}/${auth0UserId}`,
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${accessToken.access_token}`,
                },
                data: user,
            };
            const response = await apiRequest<UserDetailsObject>(options);
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Error in Auth0Api.updateUserDetails: ${errorMessage}`, { error });
            throw error;
        }
    }

    public async getUserProfileDetails(auth0UserId: string): Promise<UserDetailsObject> {
        try {
            const accessToken = await this.fetchAccessToken();
            const options: AxiosRequestConfig = {
                url: `${AUTH0_APIs.getUserDetails}/${auth0UserId}`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken.access_token}`,
                },
            };
            const response = await apiRequest<UserDetailsObject>(options);
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Error in Auth0Api.getUserProfileDetails: ${errorMessage}`, { error });
            throw error;
        }
    }

    public async changeUserPassword(auth0UserId: string, data: { password: string; connection: string }): Promise<UserDetailsObject> {
        try {
            const accessToken = await this.fetchAccessToken();
            const options: AxiosRequestConfig = {
                url: `${AUTH0_APIs.getUserDetails}/${auth0UserId}`,
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${accessToken.access_token}`,
                },
                data,
            };
            const response = await apiRequest<UserDetailsObject>(options);
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Error in Auth0Api.changeUserPassword: ${errorMessage}`, { error });
            throw error;
        }
    }
}
