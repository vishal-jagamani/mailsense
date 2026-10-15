import { apiRequest, logger } from '@utils';
import { AxiosRequestConfig } from 'axios';
import { OUTLOOK_API_BASE_URL, OUTLOOK_APIs } from '../outlook.constants.js';
import { OutlookFolderObject, OutlookFoldersResponse } from '../outlook.types.js';
import { OutlookAuthClient } from './outlook-auth.client.js';

export class OutlookFolderClient {
    static async getAllFolders(accountId: string): Promise<OutlookFoldersResponse> {
        try {
            const accessToken = await OutlookAuthClient.fetchAccessToken(accountId);
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
            const accessToken = await OutlookAuthClient.fetchAccessToken(accountId);
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
            const accessToken = await OutlookAuthClient.fetchAccessToken(accountId);
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
            const accessToken = await OutlookAuthClient.fetchAccessToken(accountId);
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
            const accessToken = await OutlookAuthClient.fetchAccessToken(accountId);
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
}
