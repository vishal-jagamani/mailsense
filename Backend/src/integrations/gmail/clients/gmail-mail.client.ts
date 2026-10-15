import { LOGGER_MODULE } from '@constants';
import { GMAIL_LABELS, GmailHistoryResponse, GmailMessageObjectFull, GmailMessages, GoogleOtherContactsSearchResponse } from '@mailsense/types';
import { createLogger } from '@observability';
import { AxiosRequestConfig } from 'axios';
import { apiRequest } from 'shared/utils/index.js';
import { GMAIL_API_BASE_URL, GMAIL_APIs, GMAIL_PEOPLE_API_BASE_URL, GMAIL_PEOPLE_APIs } from '../gmail.constants.js';
import { GmailRawMessagePayload } from '../gmail.types.js';
import { GmailAuthClient } from './gmail-auth.client.js';

const logger = createLogger(LOGGER_MODULE.GMAIL_CLIENT);

export class GmailMailClient {
    static async getHistory(accountId: string, historyId: string): Promise<GmailHistoryResponse> {
        try {
            const accessToken = await GmailAuthClient.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${GMAIL_API_BASE_URL}${GMAIL_APIs.HISTORY}`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                params: {
                    startHistoryId: historyId,
                },
            };
            const response = await apiRequest<GmailHistoryResponse>(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailMailClient.getHistory: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async fetchEmails(accountId: string, maxResults: number): Promise<GmailMessages> {
        try {
            const accessToken = await GmailAuthClient.fetchAccessToken(accountId);
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
            logger.error(`Error in GmailMailClient.fetchEmails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async fetchEmailById(messageId: string, accountId: string): Promise<GmailMessageObjectFull> {
        try {
            const accessToken = await GmailAuthClient.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${GMAIL_API_BASE_URL}${GMAIL_APIs.MESSAGES}/${messageId}?format=full`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            };
            const response: GmailMessageObjectFull = await apiRequest(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailMailClient.fetchEmailById: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async trashEmail(emailId: string, accountId: string): Promise<GmailMessageObjectFull> {
        try {
            const accessToken = await GmailAuthClient.fetchAccessToken(accountId);
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
            logger.error(`Error in GmailMailClient.trashEmail: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async permanentlyDeleteEmails(emailIds: string[], accountId: string): Promise<GmailMessages> {
        try {
            const accessToken = await GmailAuthClient.fetchAccessToken(accountId);
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
            logger.error(`Error in GmailMailClient.permanentlyDeleteEmails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async archiveEmail(emailId: string, accountId: string, archive: boolean): Promise<GmailMessageObjectFull> {
        try {
            const accessToken = await GmailAuthClient.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${GMAIL_API_BASE_URL}${GMAIL_APIs.MESSAGES}/${emailId}/modify`,
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                data: {
                    ...(archive ? { removeLabelIds: [GMAIL_LABELS.INBOX] } : { addLabelIds: [GMAIL_LABELS.INBOX] }),
                },
            };
            const response = await apiRequest<GmailMessageObjectFull>(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailMailClient.archiveEmail: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async starEmail(emailId: string, accountId: string, star: boolean): Promise<GmailMessageObjectFull> {
        try {
            const accessToken = await GmailAuthClient.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${GMAIL_API_BASE_URL}${GMAIL_APIs.MESSAGES}/${emailId}/modify`,
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                data: {
                    ...(star ? { addLabelIds: [GMAIL_LABELS.STARRED] } : { removeLabelIds: [GMAIL_LABELS.STARRED] }),
                },
            };
            const response = await apiRequest<GmailMessageObjectFull>(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailMailClient.starEmail: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async unreadEmail(emailId: string, accountId: string, unread: boolean): Promise<GmailMessageObjectFull> {
        try {
            const accessToken = await GmailAuthClient.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${GMAIL_API_BASE_URL}${GMAIL_APIs.MESSAGES}/${emailId}/modify`,
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                data: {
                    ...(unread ? { addLabelIds: [GMAIL_LABELS.UNREAD] } : { removeLabelIds: [GMAIL_LABELS.UNREAD] }),
                },
            };
            const response = await apiRequest<GmailMessageObjectFull>(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailMailClient.unreadEmail: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async sendMessage(accountId: string, message: GmailRawMessagePayload): Promise<GmailMessageObjectFull> {
        try {
            const accessToken = await GmailAuthClient.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${GMAIL_API_BASE_URL}${GMAIL_APIs.MESSAGES}/send`,
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                data: message,
            };
            const response = await apiRequest<GmailMessageObjectFull>(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailMailClient.sendMessage: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async batchModifyLabels(accountId: string, messageIds: string[], addLabelIds: string[], removeLabelIds: string[]): Promise<void> {
        try {
            const accessToken = await GmailAuthClient.fetchAccessToken(accountId);
            const cleanRemoveLabelIds = removeLabelIds.filter((id) => !addLabelIds.includes(id));
            const options: AxiosRequestConfig = {
                url: `${GMAIL_API_BASE_URL}${GMAIL_APIs.BATCH_MODIFY}`,
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                data: {
                    ids: messageIds,
                    addLabelIds,
                    removeLabelIds: cleanRemoveLabelIds,
                },
            };
            await apiRequest(options);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Error in GmailMailClient.batchModifyLabels: ${errorMessage}`, { accountId, messageIds, error });
            throw error;
        }
    }

    static async searchContacts(accountId: string, searchText: string): Promise<GoogleOtherContactsSearchResponse> {
        try {
            const accessToken = await GmailAuthClient.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${GMAIL_PEOPLE_API_BASE_URL}${GMAIL_PEOPLE_APIs.OTHER_CONTACTS}`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                params: {
                    query: searchText,
                    readMask: 'names,emailAddresses',
                },
            };
            const response: GoogleOtherContactsSearchResponse = await apiRequest(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailContactsClient.searchContacts: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
