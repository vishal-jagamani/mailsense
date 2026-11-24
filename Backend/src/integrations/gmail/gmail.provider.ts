import { NotFoundError } from '@errors';
import { AttachmentStreamResult, EmailSyncResult, IEmailProvider } from '@integrations/email/index.js';
import {
    GmailMessageObjectFull,
    GmailOAuthAccessTokenResponse,
    GmailUserProfile,
    SearchOtherContactsResponse,
    UpdateAPIResponse,
} from '@mailsense/types';
import { AccountRepository } from '@modules/accounts/database/index.js';
import { EmailDocument, EmailInput } from '@modules/emails/database/index.js';
import { ComposeEmailBody } from '@modules/emails/schema/index.js';
import { FolderInput } from '@modules/folders/database/index.js';
import { decompressString, decrypt } from '@utils';
import { GmailClient } from './clients/index.js';
import { GmailAttachmentBufferResult, GmailMessageIdParam } from './gmail.types.js';
import { GmailAttachmentService } from './services/gmail-attachment.service.js';
import { GmailAuthService } from './services/gmail-auth.service.js';
import { GmailLabelService } from './services/gmail-label.service.js';
import { GmailMessageReadService } from './services/gmail-message-read.service.js';
import { GmailMessageWriteService } from './services/gmail-message-write.service.js';

export class GmailProvider implements IEmailProvider<GmailOAuthAccessTokenResponse, GmailUserProfile, Partial<GmailMessageObjectFull>> {
    constructor(
        private readonly gmailAuthService: GmailAuthService = new GmailAuthService(),
        private readonly gmailMessageReadService: GmailMessageReadService = new GmailMessageReadService(),
        private readonly gmailMessageWriteService: GmailMessageWriteService = new GmailMessageWriteService(),
        private readonly gmailAttachmentService: GmailAttachmentService = new GmailAttachmentService(),
        private readonly gmailLabelService: GmailLabelService = new GmailLabelService(),
    ) {}

    async getAccessTokenFromCode(code: string): Promise<GmailOAuthAccessTokenResponse> {
        return this.gmailAuthService.getAccessTokenFromCode(code);
    }

    async refreshAccessToken(accountId: string): Promise<string> {
        const account = await AccountRepository.getAccountById(accountId);
        if (!account) {
            throw new NotFoundError('Account', accountId);
        }
        return GmailClient.refreshAccessToken(accountId, decrypt(account.refreshToken));
    }

    async getUserProfileFromAccessToken(accessToken: string): Promise<GmailUserProfile> {
        return this.gmailAuthService.getUserProfileFromAccessToken(accessToken);
    }

    async fetchMessages(accountId: string, cursor?: string): Promise<EmailSyncResult | null> {
        if (cursor) {
            const historyDetails = await this.gmailMessageReadService.getMessagesAfterLastHistory(accountId, cursor);
            if (!historyDetails) return null;
            return {
                addedEmails: historyDetails.addedMessages,
                deletedEmailIds: historyDetails.deletedMessages,
                newCursor: historyDetails.newHistoryId,
            };
        } else {
            const result = await this.gmailMessageReadService.getMessages(accountId);
            return {
                addedEmails: result.emails,
                deletedEmailIds: [],
                newCursor: result.lastSyncCursor,
            };
        }
    }

    async getMessageDetails(accountId: string, emailId: string, dbEmail?: EmailDocument): Promise<EmailInput> {
        if (dbEmail) {
            return {
                ...dbEmail.toObject(),
                bodyHtml: decompressString(dbEmail.bodyHtml),
                bodyPlain: decompressString(dbEmail.bodyPlain),
            };
        }
        const emails = await this.gmailMessageReadService.getMessagesByMessagesId(accountId, [emailId]);
        if (!emails.length) {
            throw new NotFoundError('Email', emailId);
        }
        return emails[0];
    }

    async deleteEmails(emailIds: string[], accountId: string, trash?: boolean): Promise<void> {
        await this.gmailMessageWriteService.deleteEmails(emailIds, accountId, trash);
    }

    async archiveEmails(emailIds: string[], accountId: string, archive: boolean): Promise<void> {
        await this.gmailMessageWriteService.archiveEmails(emailIds, accountId, archive);
    }

    async unreadEmails(emailIds: string[], accountId: string, unread: boolean): Promise<void> {
        await this.gmailMessageWriteService.unreadEmails(emailIds, accountId, unread);
    }

    async starEmails(emails: GmailMessageIdParam[], accountId: string, star: boolean): Promise<void> {
        await this.gmailMessageWriteService.starEmails(emails, accountId, star);
    }

    async sendMail(composeEmailData: ComposeEmailBody): Promise<Partial<GmailMessageObjectFull>> {
        return this.gmailMessageWriteService.sendMessage(composeEmailData);
    }

    async moveEmails(emailIds: string[], accountId: string, targetFolderIds: string[], removeFolderIds?: string[]): Promise<UpdateAPIResponse> {
        return await this.gmailMessageWriteService.moveEmails(emailIds, accountId, targetFolderIds, removeFolderIds || []);
    }

    async searchContacts(accountId: string, searchText: string): Promise<SearchOtherContactsResponse[]> {
        return this.gmailMessageReadService.searchContacts(accountId, searchText);
    }

    async getAttachment(accountId: string, messageId: string, attachmentId: string): Promise<GmailAttachmentBufferResult> {
        return this.gmailAttachmentService.getAttachment(accountId, messageId, attachmentId);
    }

    async getAttachmentStream(accountId: string, messageId: string, attachmentId: string): Promise<AttachmentStreamResult> {
        return await this.gmailAttachmentService.getAttachmentStream(accountId, messageId, attachmentId);
    }

    async getAllFolders(accountId: string, userId: string): Promise<Partial<FolderInput>[]> {
        return this.gmailLabelService.getAllLabels(accountId, userId);
    }

    async createFolder(userId: string, accountId: string, folderName: string): Promise<UpdateAPIResponse> {
        return this.gmailLabelService.createLabel(userId, accountId, folderName);
    }

    async updateFolder(accountId: string, folderId: string, folderName: string): Promise<UpdateAPIResponse> {
        return this.gmailLabelService.updateLabel(accountId, folderId, folderName);
    }

    async deleteFolder(accountId: string, folderId: string): Promise<UpdateAPIResponse> {
        return this.gmailLabelService.deleteLabel(accountId, folderId);
    }
}
