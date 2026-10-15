import { GMAIL_SECRETS } from '@config';
import { LOGGER_MODULE, OAUTH_ACCESS_TOKEN_URI } from '@constants';
import { NotFoundError } from '@errors';
import { GmailOAuthAccessTokenResponse, GmailUserProfile } from '@mailsense/types';
import { AccountRepository } from '@modules/accounts/account.repository.js';
import { createLogger } from '@observability';
import { AxiosRequestConfig } from 'axios';
import { apiRequest, decrypt, encrypt } from 'shared/utils/index.js';
import { GMAIL_USER_INFO } from '../gmail.constants.js';

const logger = createLogger(LOGGER_MODULE.GMAIL_CLIENT);

export class GmailAuthClient {
    static async getAccessTokenFromCode(code: string): Promise<GmailOAuthAccessTokenResponse> {
        try {
            const options: AxiosRequestConfig = {
                url: OAUTH_ACCESS_TOKEN_URI.GMAIL,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                data: {
                    code,
                    client_id: GMAIL_SECRETS.clientId,
                    client_secret: GMAIL_SECRETS.clientSecret,
                    redirect_uri: GMAIL_SECRETS.redirectUri,
                    grant_type: 'authorization_code',
                },
            };
            const response: GmailOAuthAccessTokenResponse = await apiRequest(options);
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Error in GmailAuthClient.getAccessTokenFromCode: ${errorMessage}`, { error });
            throw error;
        }
    }

    static async fetchAccessToken(accountId: string): Promise<string> {
        try {
            const account = await AccountRepository.getAccountById(accountId);
            if (!account) {
                throw new NotFoundError('Account', accountId);
            }
            return account.accessTokenExpiry < Date.now()
                ? await this.refreshAccessToken(accountId, decrypt(account.refreshToken))
                : decrypt(account.accessToken);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailAuthClient.fetchAccessToken: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async refreshAccessToken(accountId: string, refreshToken: string): Promise<string> {
        try {
            const options: AxiosRequestConfig = {
                url: OAUTH_ACCESS_TOKEN_URI.GMAIL,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                data: {
                    refresh_token: refreshToken,
                    client_id: GMAIL_SECRETS.clientId,
                    client_secret: GMAIL_SECRETS.clientSecret,
                    grant_type: 'refresh_token',
                },
            };
            const response: GmailOAuthAccessTokenResponse = await apiRequest(options);
            await AccountRepository.updateAccountAccessToken(accountId, encrypt(response?.access_token), Date.now() + response?.expires_in * 1000);
            return response?.access_token;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailAuthClient.refreshAccessToken: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async getUserProfileFromAccessToken(accessToken: string): Promise<GmailUserProfile> {
        try {
            const options: AxiosRequestConfig = {
                url: GMAIL_USER_INFO,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            };
            const response: GmailUserProfile = await apiRequest(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailAuthClient.getUserProfileFromAccessToken: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
