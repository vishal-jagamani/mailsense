import { AccountRepository } from '@modules/accounts/account.repository.js';
import { AxiosRequestConfig } from 'axios';
import { OUTLOOK_API_BASE_URL, OUTLOOK_APIs, OUTLOOK_TOKEN_URI } from './outlook.constants.js';
import { decrypt, encrypt } from '@utils/crypto.js';
import { OUTLOOK_SECRETS } from '@config/config.js';
import { OutlookOAuthAccessTokenResponse } from 'types/account.types.js';
import { apiRequest } from '@utils/axios.js';
import { logger } from '@utils/logger.js';
import { OAUTH_ACCESS_TOKEN_URI } from '@constants/oauth.constants.js';
import { OutlookUserProfile } from './outlook.types.js';

export class OutlookApi {
    async getAccessTokenFromCode(code: string): Promise<OutlookOAuthAccessTokenResponse> {
        try {
            const options: AxiosRequestConfig = {
                url: OAUTH_ACCESS_TOKEN_URI.OUTLOOK,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                data: {
                    code,
                    client_id: OUTLOOK_SECRETS.client_id,
                    client_secret: OUTLOOK_SECRETS.client_secret,
                    redirect_uri: OUTLOOK_SECRETS.redirect_uri,
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
    // Function to fetch access token from DB
    private async fetchAccessToken(accountId: string) {
        try {
            const account = await AccountRepository.getAccountById(accountId);
            if (!account) throw new Error('Account not found');
            return account.accessTokenExpiry < Date.now() ? await this.refreshAccessToken(accountId) : decrypt(account.accessToken);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookApi.fetchAccessToken: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    // Function to refresh the access token if it is expired
    private async refreshAccessToken(accountId: string) {
        try {
            const account = await AccountRepository.getAccountById(accountId);
            if (!account) throw new Error('Account not found');
            const options: AxiosRequestConfig = {
                url: OUTLOOK_TOKEN_URI,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                data: {
                    refresh_token: decrypt(account.refreshToken),
                    client_id: OUTLOOK_SECRETS.client_id,
                    client_secret: OUTLOOK_SECRETS.client_secret,
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

    async getUserProfileFromAccessToken(accessToken: string): Promise<OutlookUserProfile> {
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
