import { AxiosRequestConfig } from 'axios';

import { AccountRepository } from '@modules/accounts/account.repository.js';
import { OutlookOAuthAccessTokenResponse } from '@types';
import { apiRequest, decrypt, encrypt, logger } from 'shared/utils/index.js';
import { OUTLOOK_API_BASE_URL, OUTLOOK_APIs, OUTLOOK_TOKEN_URI } from './outlook.constants.js';
import {
    GetDeltaMessageChangesResponse,
    OutlookFolderObject,
    OutlookFolders,
    OutlookFoldersResponse,
    OutlookMessageObjectFull,
    OutlookMessagesResponse,
    OutlookPeopleSearchResponse,
    OutlookUserProfile,
} from './outlook.types.js';
import { OAUTH_ACCESS_TOKEN_URI } from '@constants';
import { OUTLOOK_SECRETS } from '@config';

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

    // Function to fetch access token from DB
    static async fetchAccessToken(accountId: string): Promise<string> {
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
    static async refreshAccessToken(accountId: string) {
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

    async getMessagesFromDeltaLink(accountId: string, deltaLink: string) {
        try {
            const accessToken = await OutlookApi.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: deltaLink,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            };
            const response = await apiRequest<GetDeltaMessageChangesResponse>(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookApi.getMessagesFromDeltaLink: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async getMessages(accountId: string, nextPageUrl?: string) {
        try {
            const accessToken = await this.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: nextPageUrl || `${OUTLOOK_API_BASE_URL}${OUTLOOK_APIs.MESSAGES}`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            };
            const response: OutlookMessagesResponse = await apiRequest(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookApi.getMessages: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async getMessageDetails(accountId: string, emailId: string): Promise<OutlookMessageObjectFull> {
        try {
            const accessToken = await this.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${OUTLOOK_API_BASE_URL}${OUTLOOK_APIs.MESSAGES}/${emailId}`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Prefer: 'IdType="ImmutableId"',
                },
            };
            const response = await apiRequest<OutlookMessageObjectFull>(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookApi.getMessages: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async deleteEmail(emailId: string, accountId: string) {
        try {
            const accessToken = await this.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${OUTLOOK_API_BASE_URL}${OUTLOOK_APIs.MESSAGES}/${emailId}/move`,
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                data: {
                    destinationId: OutlookFolders.DELETED,
                },
            };
            const response = await apiRequest<OutlookMessageObjectFull>(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookApi.deleteEmail: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async deleteEmailPermanently(emailId: string, accountId: string) {
        try {
            const accessToken = await this.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${OUTLOOK_API_BASE_URL}${OUTLOOK_APIs.MESSAGES}/${emailId}/permanentDelete`,
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            };
            const response = await apiRequest<void>(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookApi.deleteEmailPermanently: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async archiveEmail(emailId: string, accountId: string) {
        try {
            const accessToken = await this.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${OUTLOOK_API_BASE_URL}${OUTLOOK_APIs.MESSAGES}/${emailId}/move`,
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                data: {
                    destinationId: OutlookFolders.ARCHIVE,
                },
            };
            const response = await apiRequest<OutlookMessageObjectFull>(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookApi.archiveEmail: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async unarchiveEmail(emailId: string, accountId: string) {
        try {
            const accessToken = await this.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${OUTLOOK_API_BASE_URL}${OUTLOOK_APIs.MESSAGES}/${emailId}/move`,
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                data: {
                    destinationId: OutlookFolders.INBOX,
                },
            };
            const response = await apiRequest<OutlookMessageObjectFull>(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookApi.unarchiveEmail: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async unreadEmail(emailId: string, accountId: string, unread: boolean) {
        try {
            const accessToken = await this.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${OUTLOOK_API_BASE_URL}${OUTLOOK_APIs.MESSAGES}/${emailId}`,
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                data: {
                    isRead: !unread,
                },
            };
            const response = await apiRequest<OutlookMessageObjectFull>(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookApi.unreadEmail: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async flagEmail(emailId: string, accountId: string, flag: boolean) {
        try {
            const accessToken = await this.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${OUTLOOK_API_BASE_URL}${OUTLOOK_APIs.MESSAGES}/${emailId}`,
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                data: {
                    flag: {
                        flagStatus: flag ? 'flagged' : 'notFlagged',
                    },
                },
            };
            const response = await apiRequest<OutlookMessageObjectFull>(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookApi.flagEmail: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async getAllFolders(accountId: string): Promise<OutlookFoldersResponse> {
        try {
            const accessToken = await this.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${OUTLOOK_API_BASE_URL}${OUTLOOK_APIs.FOLDERS}`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            };
            const response = await apiRequest<OutlookFoldersResponse>(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookApi.getAllFolders: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async getFolderDetails(accountId: string, folderId: string): Promise<OutlookFolderObject> {
        try {
            const accessToken = await this.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${OUTLOOK_API_BASE_URL}${OUTLOOK_APIs.FOLDERS}/${folderId}`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            };
            const response = await apiRequest<OutlookFolderObject>(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookApi.getFolderDetails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async createFolder(accountId: string, folderName: string, isHidden: boolean): Promise<OutlookFolderObject> {
        try {
            const accessToken = await this.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${OUTLOOK_API_BASE_URL}${OUTLOOK_APIs.FOLDERS}`,
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                data: {
                    displayName: folderName,
                    isHidden,
                },
            };
            const response = await apiRequest<OutlookFolderObject>(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookApi.createFolder: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async updateFolder(accountId: string, folderId: string, folderName: string): Promise<OutlookFolderObject> {
        try {
            const accessToken = await this.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${OUTLOOK_API_BASE_URL}${OUTLOOK_APIs.FOLDERS}/${folderId}`,
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                data: {
                    displayName: folderName,
                },
            };
            const response = await apiRequest<OutlookFolderObject>(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookApi.updateFolder: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async deleteFolder(accountId: string, folderId: string): Promise<void> {
        try {
            const accessToken = await this.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${OUTLOOK_API_BASE_URL}${OUTLOOK_APIs.FOLDERS}/${folderId}`,
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            };
            await apiRequest<void>(options);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookApi.deleteFolder: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async createDraftMessage(accountId: string, message: Partial<OutlookMessageObjectFull>): Promise<OutlookMessageObjectFull> {
        try {
            const accessToken = await this.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${OUTLOOK_API_BASE_URL}${OUTLOOK_APIs.PROFILE}/messages`,
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    Prefer: 'IdType="ImmutableId"',
                },
                data: message,
            };
            const response = await apiRequest<OutlookMessageObjectFull>(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookApi.sendMessage: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async sendDraftMessage(accountId: string, messageId: string): Promise<void> {
        try {
            const accessToken = await this.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${OUTLOOK_API_BASE_URL}${OUTLOOK_APIs.PROFILE}/messages/${messageId}/send`,
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            };
            await apiRequest<void>(options);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookApi.sendDraftMessage: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async searchContacts(accountId: string, searchText: string): Promise<OutlookPeopleSearchResponse> {
        try {
            const accessToken = await this.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${OUTLOOK_API_BASE_URL}${OUTLOOK_APIs.PROFILE}/people`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                params: {
                    $search: `"${searchText}"`,
                    $top: 10,
                    $select: 'displayName,givenName,surname,scoredEmailAddresses,personType',
                },
            };
            const response = await apiRequest<OutlookPeopleSearchResponse>(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookApi.searchContacts: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
