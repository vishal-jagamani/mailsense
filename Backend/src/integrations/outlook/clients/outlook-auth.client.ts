import { OUTLOOK_SECRETS } from '@config';
import { OAUTH_ACCESS_TOKEN_URI } from '@constants';
import { NotFoundError } from '@errors';
import { OutlookOAuthAccessTokenResponse, OutlookUserProfile } from '@mailsense/types';
import { AccountRepository } from '@modules/accounts/account.repository.js';
import { apiRequest, decrypt, encrypt, logger } from '@utils';
import { AxiosRequestConfig } from 'axios';
import { OUTLOOK_API_BASE_URL, OUTLOOK_APIs, OUTLOOK_TOKEN_URI } from '../outlook.constants.js';

export class OutlookAuthClient {
    static async getAccessTokenFromCode(code: string): Promise<OutlookOAuthAccessTokenResponse> {
        try {
            const options: AxiosRequestConfig = {
                url: OAUTH_ACCESS_TOKEN_URI.OUTLOOK,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                data: {
                    code,
                    client_id: OUTLOOK_SECRETS.clientId,
                    client_secret: OUTLOOK_SECRETS.clientSecret,
                    redirect_uri: OUTLOOK_SECRETS.redirectUri,
                    grant_type: 'authorization_code',
                },
            };
            const response: OutlookOAuthAccessTokenResponse = await apiRequest(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailService.getAccessTokenFromCode: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async fetchAccessToken(accountId: string): Promise<string> {
        try {
            const account = await AccountRepository.getAccountById(accountId);
            if (!account) {
                throw new NotFoundError('Account', accountId);
            }
            return account.accessTokenExpiry < Date.now() ? await this.refreshAccessToken(accountId) : decrypt(account.accessToken);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookApi.fetchAccessToken: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async refreshAccessToken(accountId: string) {
        try {
            const account = await AccountRepository.getAccountById(accountId);
            if (!account) {
                throw new NotFoundError('Account', accountId);
            }
            const options: AxiosRequestConfig = {
                url: OUTLOOK_TOKEN_URI,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                data: {
                    refresh_token: decrypt(account.refreshToken),
                    client_id: OUTLOOK_SECRETS.clientId,
                    client_secret: OUTLOOK_SECRETS.clientSecret,
                    grant_type: 'refresh_token',
                },
            };
            const response: OutlookOAuthAccessTokenResponse = await apiRequest(options);
            await AccountRepository.updateAccountAccessToken(accountId, encrypt(response?.access_token), Date.now() + response?.expires_in * 1000);
            return response?.access_token;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookApi.refreshAccessToken: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async getUserProfileFromAccessToken(accessToken: string): Promise<OutlookUserProfile> {
        try {
            const options: AxiosRequestConfig = {
                url: `${OUTLOOK_API_BASE_URL}${OUTLOOK_APIs.PROFILE}`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            };
            const response: OutlookUserProfile = await apiRequest(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookApi.getUserProfileFromAccessToken: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
