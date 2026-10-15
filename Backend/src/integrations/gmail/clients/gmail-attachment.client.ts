import { LOGGER_MODULE } from '@constants';
import { AttachmentStreamResult } from '@integrations/email/email.provider.types.js';
import { createLogger } from '@observability';
import { AxiosRequestConfig } from 'axios';
import { apiRequest } from 'shared/utils/index.js';
import { Readable } from 'stream';
import { GMAIL_API_BASE_URL, GMAIL_APIs } from '../gmail.constants.js';
import { GmailAttachmentBufferResult, GmailAttachmentDataResponse } from '../gmail.types.js';
import { GmailAuthClient } from './gmail-auth.client.js';

const logger = createLogger(LOGGER_MODULE.GMAIL_CLIENT);

export class GmailAttachmentClient {
    static async getAttachment(
        accountId: string,
        messageId: string,
        attachmentId: string,
    ): Promise<GmailAttachmentBufferResult> {
        try {
            const accessToken = await GmailAuthClient.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${GMAIL_API_BASE_URL}${GMAIL_APIs.MESSAGES}/${messageId}/attachments/${attachmentId}`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            };
            const response = await apiRequest<GmailAttachmentDataResponse>(options);
            const data = Buffer.from(response.data, 'base64url');
            return {
                data,
                mimeType: 'application/octet-stream',
                filename: 'attachment',
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailAttachmentClient.getAttachment: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    static async getAttachmentStream(
        accountId: string,
        messageId: string,
        attachmentId: string,
    ): Promise<AttachmentStreamResult> {
        try {
            const accessToken = await GmailAuthClient.fetchAccessToken(accountId);
            const options: AxiosRequestConfig = {
                url: `${GMAIL_API_BASE_URL}${GMAIL_APIs.MESSAGES}/${messageId}/attachments/${attachmentId}`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            };
            const response = await apiRequest<GmailAttachmentDataResponse>(options);
            const buffer = Buffer.from(response.data, 'base64url');
            const stream = Readable.from(buffer);
            return {
                stream,
                mimeType: 'application/octet-stream',
                filename: 'attachment',
                contentLength: buffer.length,
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailAttachmentClient.getAttachmentStream: ${errorMessage}`, {
                error: err,
                accountId,
                messageId,
                attachmentId,
            });
            throw err;
        }
    }
}
