import { AttachmentStreamResult } from '@integrations/email/email.provider.types.js';
import { OutlookAttachmentObject } from '@mailsense/types';
import { apiRequest, logger } from '@utils';
import axios, { AxiosRequestConfig } from 'axios';
import { Readable } from 'stream';
import { OUTLOOK_API_BASE_URL, OUTLOOK_APIs } from '../outlook.constants.js';
import { OutlookAuthClient } from './outlook-auth.client.js';

export class OutlookAttachmentClient {
    static async getMessageAttachments(accountId: string, messageId: string): Promise<OutlookAttachmentObject[]> {
        try {
            const accessToken = await OutlookAuthClient.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${OUTLOOK_API_BASE_URL}${OUTLOOK_APIs.ATTACHMENTS(messageId)}`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            };
            const response = await apiRequest<{ value: OutlookAttachmentObject[] }>(options);
            return response?.value || [];
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookApi.getMessageAttachments: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async getAttachment(accountId: string, messageId: string, attachmentId: string): Promise<Buffer> {
        try {
            const accessToken = await OutlookAuthClient.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${OUTLOOK_API_BASE_URL}${OUTLOOK_APIs.ATTACHMENT(messageId, attachmentId)}`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                responseType: 'arraybuffer',
            };
            const response = await apiRequest<Buffer>(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookApi.getAttachment: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async getAttachmentStream(accountId: string, messageId: string, attachmentId: string): Promise<AttachmentStreamResult> {
        try {
            const accessToken = await OutlookAuthClient.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${OUTLOOK_API_BASE_URL}${OUTLOOK_APIs.ATTACHMENT(messageId, attachmentId)}`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                responseType: 'stream',
            };
            const response = await axios.request<Readable>(options);
            const contentType = (response.headers['content-type'] as string) || 'application/octet-stream';
            const contentLengthHeader = response.headers['content-length'];
            const contentLength = contentLengthHeader ? Number(contentLengthHeader) : undefined;

            return {
                stream: response.data,
                mimeType: contentType,
                filename: 'attachment',
                contentLength,
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookApi.getAttachmentStream: ${errorMessage}`, { error: err, accountId, messageId, attachmentId });
            throw err;
        }
    }
}
