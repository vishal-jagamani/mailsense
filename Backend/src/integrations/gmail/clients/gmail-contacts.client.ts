import { LOGGER_MODULE } from '@constants';
import { GmailLabel, GmailLabelsListResponse } from '@mailsense/types';
import { createLogger } from '@observability';
import { AxiosRequestConfig } from 'axios';
import { apiRequest } from 'shared/utils/index.js';
import { GMAIL_API_BASE_URL, GMAIL_APIs } from '../gmail.constants.js';
import { GmailAuthClient } from './gmail-auth.client.js';

const logger = createLogger(LOGGER_MODULE.GMAIL_CLIENT);

export class GmailFolderClient {
    static async getAllLabels(accountId: string): Promise<GmailLabel[]> {
        try {
            const accessToken = await GmailAuthClient.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${GMAIL_API_BASE_URL}${GMAIL_APIs.LABELS}`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            };
            const response: GmailLabelsListResponse = await apiRequest(options);
            return response.labels;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailFolderClient.getAllLabels: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async getLabelDetails(accountId: string, labelId: string): Promise<GmailLabel> {
        try {
            const accessToken = await GmailAuthClient.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${GMAIL_API_BASE_URL}${GMAIL_APIs.LABELS}/${labelId}`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            };
            const response: GmailLabel = await apiRequest(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailFolderClient.getLabelDetails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async createLabel(accountId: string, labelName: string): Promise<GmailLabel> {
        try {
            const accessToken = await GmailAuthClient.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${GMAIL_API_BASE_URL}${GMAIL_APIs.LABELS}`,
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                data: {
                    name: labelName,
                },
            };
            const response: GmailLabel = await apiRequest(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailFolderClient.createLabel: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async updateLabel(accountId: string, labelId: string, labelName: string): Promise<GmailLabel> {
        try {
            const accessToken = await GmailAuthClient.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${GMAIL_API_BASE_URL}${GMAIL_APIs.LABELS}/${labelId}`,
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                data: {
                    name: labelName,
                },
            };
            const response: GmailLabel = await apiRequest(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailFolderClient.updateLabel: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async deleteLabel(accountId: string, labelId: string): Promise<void> {
        try {
            const accessToken = await GmailAuthClient.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${GMAIL_API_BASE_URL}${GMAIL_APIs.LABELS}/${labelId}`,
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            };
            await apiRequest<void>(options);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailFolderClient.deleteLabel: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
