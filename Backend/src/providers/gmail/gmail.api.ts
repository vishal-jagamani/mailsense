import { AccountRepository } from '@modules/accounts/account.repository.js';
import { logger } from '@utils/logger.js';
import { GMAIL_API_BASE_URL, GMAIL_APIs, GMAIL_USER_INFO } from './gmail.constants.js';
import { AxiosRequestConfig } from 'axios';
import { apiRequest } from '@utils/axios.js';
import { decrypt, encrypt } from '@utils/crypto.js';
import { OAUTH_ACCESS_TOKEN_URI } from '@constants/oauth.constants.js';
import { GMAIL_SECRETS } from '@config/config.js';
import { GmailOAuthAccessTokenResponse } from 'types/account.types.js';
import { GmailMessageObjectFull, GmailMessages, GmailUserProfile } from './gmail.types.js';

export class GmailApi {
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
            logger.error(`Error in GmailApi.getAccessTokenFromCode: ${errorMessage}`, { error });
            throw error;
        }
    }

    // Function to fetch access token from DB
    static async fetchAccessToken(accountId: string) {
        try {
            const account = await AccountRepository.getAccountById(accountId);
            if (!account) throw new Error('Account not found');
            return account.accessTokenExpiry < Date.now()
                ? await this.refreshAccessToken(accountId, decrypt(account.refreshToken))
                : decrypt(account.accessToken);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailApi.fetchAccessToken: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    // Function to refresh the access token if it is expired
    static async refreshAccessToken(accountId: string, refreshToken: string) {
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
            logger.error(`Error in GmailApi.refreshAccessToken: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    // Function to get user profile from access token
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
            logger.error(`Error in GmailApi.getUserProfileFromAccessToken: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    // Function to fetch emails from account
    static async fetchEmails(accountId: string, maxResults: number): Promise<GmailMessages> {
        try {
            const accessToken = await this.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${GMAIL_API_BASE_URL}${GMAIL_APIs.MESSAGES}`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                params: {
                    maxResults,
                },
            };
            const response: GmailMessages = await apiRequest(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailApi.fetchEmails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async fetchEmailById(messageId: string, accountId: string): Promise<GmailMessageObjectFull> {
        try {
            const accessToken = await this.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${GMAIL_API_BASE_URL}${GMAIL_APIs.MESSAGES}/${messageId}?format=full`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            };
            const response: GmailMessageObjectFull = await apiRequest(options);
            logger.info(`Fetched email ${messageId}`, { response });
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailApi.fetchEmailById: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async trashEmail(emailId: string, accountId: string): Promise<GmailMessageObjectFull> {
        try {
            const accessToken = await this.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${GMAIL_API_BASE_URL}${GMAIL_APIs.MESSAGES}/${emailId}/trash`,
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            };
            const response: GmailMessageObjectFull = await apiRequest(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailApi.deleteEmails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static async permanentlyDeleteEmails(emailIds: string[], accountId: string): Promise<any> {
        try {
            const accessToken = await this.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${GMAIL_API_BASE_URL}${GMAIL_APIs.BATCH_DELETE}`,
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                data: {
                    ids: emailIds,
                },
            };
            const response: GmailMessages = await apiRequest(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailApi.deleteEmails: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
