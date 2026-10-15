import { OUTLOOK_FOLDERS, OutlookMessageObjectFull, OutlookMessagesResponse, OutlookUploadSessionResponse } from '@mailsense/types';
import { apiRequest, logger } from '@utils';
import { AxiosRequestConfig } from 'axios';
import { OUTLOOK_API_BASE_URL, OUTLOOK_APIs } from '../outlook.constants.js';
import {
    GetDeltaMessageChangesResponse,
    OutlookCreateMessagePayload,
    OutlookPeopleSearchResponse,
    OutlookSendMailDirectPayload,
} from '../outlook.types.js';
import { buildOutlookMessagePayload } from '../outlook.utils.js';
import { OutlookAuthClient } from './outlook-auth.client.js';

export class OutlookMailClient {
    static async getMessagesFromDeltaLink(accountId: string, deltaLink: string) {
        try {
            const accessToken = await OutlookAuthClient.fetchAccessToken(accountId);
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
            const accessToken = await OutlookAuthClient.fetchAccessToken(accountId);
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
            const accessToken = await OutlookAuthClient.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${OUTLOOK_API_BASE_URL}${OUTLOOK_APIs.MESSAGES}/${emailId}`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Prefer: 'IdType="ImmutableId"',
                },
                params: {
                    $expand: 'attachments',
                },
            };
            const response = await apiRequest<OutlookMessageObjectFull>(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookApi.getMessageDetails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async deleteEmail(emailId: string, accountId: string) {
        try {
            const accessToken = await OutlookAuthClient.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${OUTLOOK_API_BASE_URL}${OUTLOOK_APIs.MESSAGES}/${emailId}/move`,
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                data: {
                    destinationId: OUTLOOK_FOLDERS.DELETED,
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
            const accessToken = await OutlookAuthClient.fetchAccessToken(accountId);
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
            const accessToken = await OutlookAuthClient.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${OUTLOOK_API_BASE_URL}${OUTLOOK_APIs.MESSAGES}/${emailId}/move`,
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                data: {
                    destinationId: OUTLOOK_FOLDERS.ARCHIVE,
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
            const accessToken = await OutlookAuthClient.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${OUTLOOK_API_BASE_URL}${OUTLOOK_APIs.MESSAGES}/${emailId}/move`,
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                data: {
                    destinationId: OUTLOOK_FOLDERS.INBOX,
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
            const accessToken = await OutlookAuthClient.fetchAccessToken(accountId);
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
            const accessToken = await OutlookAuthClient.fetchAccessToken(accountId);
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

    static async createDraftMessage(
        accountId: string,
        message: OutlookCreateMessagePayload | Partial<OutlookMessageObjectFull>,
    ): Promise<OutlookMessageObjectFull> {
        try {
            const accessToken = await OutlookAuthClient.fetchAccessToken(accountId);
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
            const accessToken = await OutlookAuthClient.fetchAccessToken(accountId);
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
            const accessToken = await OutlookAuthClient.fetchAccessToken(accountId);
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

    static async sendMailDirect(accountId: string, payload: OutlookSendMailDirectPayload): Promise<void> {
        try {
            const accessToken = await OutlookAuthClient.fetchAccessToken(accountId);
            const messageBody = buildOutlookMessagePayload(payload.to, payload.subject, payload.body, 'HTML');
            const options: AxiosRequestConfig = {
                url: `${OUTLOOK_API_BASE_URL}${OUTLOOK_APIs.PROFILE}/sendMail`,
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                data: {
                    message: {
                        ...messageBody,
                        attachments: payload.attachments,
                    },
                    saveToSentItems: 'true',
                },
            };
            await apiRequest<void>(options);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookApi.sendMailDirect: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async createUploadSession(accountId: string, messageId: string, filename: string, size: number): Promise<OutlookUploadSessionResponse> {
        try {
            const accessToken = await OutlookAuthClient.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${OUTLOOK_API_BASE_URL}${OUTLOOK_APIs.PROFILE}/messages/${messageId}/attachments/createUploadSession`,
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                data: {
                    AttachmentItem: {
                        attachmentType: 'file',
                        name: filename,
                        size,
                    },
                },
            };
            const response = await apiRequest<OutlookUploadSessionResponse>(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookApi.createUploadSession: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async uploadChunk(uploadUrl: string, chunk: Buffer, start: number, totalSize: number): Promise<void> {
        try {
            const end = start + chunk.length - 1;
            const options: AxiosRequestConfig = {
                url: uploadUrl,
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Content-Length': chunk.length,
                    'Content-Range': `bytes ${start}-${end}/${totalSize}`,
                },
                data: chunk,
                timeout: 60000,
            };
            await apiRequest<void>(options);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookApi.uploadChunk: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async moveMessage(accountId: string, messageId: string, destinationId: string): Promise<OutlookMessageObjectFull> {
        try {
            const accessToken = await OutlookAuthClient.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${OUTLOOK_API_BASE_URL}${OUTLOOK_APIs.MOVE_MESSAGE(messageId)}`,
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                data: {
                    destinationId,
                },
            };
            const response: OutlookMessageObjectFull = await apiRequest(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookApi.moveMessage: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
