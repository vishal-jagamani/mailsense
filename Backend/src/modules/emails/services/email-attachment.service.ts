import { LOGGER_MODULE } from '@constants';
import { ForbiddenError, NotFoundError } from '@errors';
import { EmailProviderFactory } from '@integrations/email/email.provider.factory.js';
import { AttachmentStreamResult } from '@integrations/email/email.provider.types.js';
import { GmailAttachmentBufferResult } from '@integrations/gmail/gmail.types.js';
import { EmailAttachment } from '@mailsense/types';
import { AccountRepository } from '@modules/accounts/account.repository.js';
import { createLogger } from '@observability';
import { EmailRepository } from '../database/email.repository.js';
import { AttachmentMetadata, AuthorizedAttachmentContext } from '../email.types.js';

const logger = createLogger(LOGGER_MODULE.EMAIL_SERVICE);

export class EmailAttachmentService {
    private async getAuthorizedEmailAndAccount(userId: string, emailId: string): Promise<AuthorizedAttachmentContext> {
        const email = await EmailRepository.getEmail(emailId);
        if (!email) {
            throw new NotFoundError('Email', emailId);
        }

        const account = await AccountRepository.getAccountById(email.accountId);
        if (!account) {
            throw new NotFoundError('Account', email.accountId);
        }

        if (account.userId !== userId) {
            throw new ForbiddenError('Unauthorized attempt to access attachment');
        }

        return { email, account };
    }

    public async downloadAttachment(userId: string, emailId: string, attachmentId: string): Promise<GmailAttachmentBufferResult> {
        try {
            const { email, account } = await this.getAuthorizedEmailAndAccount(userId, emailId);
            const attachment = email.attachments?.find((att) => att.attachmentId === attachmentId);

            const provider = EmailProviderFactory.getProvider(account.provider);
            const result = await provider.getAttachment(email.accountId, email.providerMessageId, attachmentId);
            const meta = this.resolveAttachmentMetadata(attachment, result.mimeType, result.filename);

            return {
                data: result.data,
                mimeType: meta.mimeType,
                filename: meta.filename,
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.downloadAttachment: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async downloadAttachmentStream(userId: string, emailId: string, attachmentId: string): Promise<AttachmentStreamResult> {
        try {
            const { email, account } = await this.getAuthorizedEmailAndAccount(userId, emailId);
            const attachment = email.attachments?.find((att) => att.attachmentId === attachmentId);

            const provider = EmailProviderFactory.getProvider(account.provider);
            const result = await provider.getAttachmentStream(email.accountId, email.providerMessageId, attachmentId);
            const meta = this.resolveAttachmentMetadata(attachment, result.mimeType, result.filename);

            return {
                stream: result.stream,
                mimeType: meta.mimeType,
                filename: meta.filename,
                contentLength: attachment?.size || result.contentLength,
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.downloadAttachmentStream: ${errorMessage}`, { error: err, emailId, attachmentId });
            throw err;
        }
    }

    private resolveAttachmentMetadata(attachment?: EmailAttachment, remoteMime?: string, remoteFilename?: string): AttachmentMetadata {
        return {
            mimeType: attachment?.mimeType || remoteMime || 'application/octet-stream',
            filename: attachment?.filename || remoteFilename || 'attachment',
        };
    }
}
