import { LOGGER_MODULE } from '@constants';
import { OutlookMessageObjectFull, OutlookMessagesResponse } from '@mailsense/types';
import { createLogger } from '@observability';
import { apiRequest } from '@utils';
import { AxiosRequestConfig } from 'axios';
import { OUTLOOK_API_BASE_URL, OUTLOOK_APIs } from '../outlook.constants.js';
import { GetDeltaMessageChangesResponse, OutlookPeopleSearchResponse } from '../outlook.types.js';
import { OutlookAuthClient } from './outlook-auth.client.js';

const logger = createLogger(LOGGER_MODULE.OUTLOOK_CLIENT);

export class OutlookMailReadClient {
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
}
