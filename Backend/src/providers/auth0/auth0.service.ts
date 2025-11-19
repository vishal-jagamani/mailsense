import { UserDetailsObject } from '@modules/user/user.types.js';
import { logger } from '@utils/logger.js';
import { Auth0Api } from './auth0.api.js';
import { Auth0UserDetailsResponse } from './auth0.types.js';

export class Auth0Service {
    private auth0Api: Auth0Api;

    constructor() {
        this.auth0Api = new Auth0Api();
    }

    async getUserDetails(auth0UserId: string): Promise<Auth0UserDetailsResponse> {
        try {
            const response = await this.auth0Api.getUserDetails(auth0UserId);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in Auth0Service.getUserDetails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async updateUserDetails(auth0UserId: string, user: UserDetailsObject): Promise<UserDetailsObject> {
        try {
            const response = await this.auth0Api.updateUserDetails(auth0UserId, user);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in Auth0Service.updateUserDetails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async getUserProfileDetails(auth0UserId: string): Promise<UserDetailsObject> {
        try {
            const response = await this.auth0Api.getUserProfileDetails(auth0UserId);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in Auth0Service.getUserProfileDetails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async changeUserPassword(auth0UserId: string, user: { password: string; connection: string }): Promise<UserDetailsObject> {
        try {
            const response = await this.auth0Api.changeUserPassword(auth0UserId, user);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in Auth0Service.changeUserPassword: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
