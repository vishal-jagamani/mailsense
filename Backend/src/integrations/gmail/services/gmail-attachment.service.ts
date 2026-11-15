import { LOGGER_MODULE } from '@constants';
import { AttachmentStreamResult } from '@integrations/email/index.js';
import { createLogger } from '@observability';
import { GmailClient } from '../clients/index.js';
import { GmailAttachmentBufferResult } from '../gmail.types.js';

const logger = createLogger(LOGGER_MODULE.GMAIL_SERVICE);

export class GmailAttachmentService {
    public async getAttachment(accountId: string, messageId: string, attachmentId: string): Promise<GmailAttachmentBufferResult> {
        try {
            return await GmailClient.getAttachment(accountId, messageId, attachmentId);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailService.getAttachment: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async getAttachmentStream(accountId: string, messageId: string, attachmentId: string): Promise<AttachmentStreamResult> {
        try {
            return await GmailClient.getAttachmentStream(accountId, messageId, attachmentId);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailService.getAttachmentStream: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
