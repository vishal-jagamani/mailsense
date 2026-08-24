import { IEmailProvider, SyncResult } from '@integrations/email/email.provider.js';
import {
    GmailOAuthAccessTokenResponse,
    SearchOtherContactsResponse,
    UpdateAPIResponse,
    GmailMessageObjectFull,
    GmailUserProfile,
} from '@mailsense/types';
import { AccountRepository } from '@modules/accounts/account.repository.js';
import { EmailDocument, EmailInput } from '@modules/emails/email.model.js';
import { ComposeEmailBody } from '@modules/emails/email.schema.js';
import { FolderInput } from '@modules/folders/folder.model.js';
import { decompressString, decrypt } from '@utils';
import { GmailApi } from './gmail.client.js';
import { GmailService } from './gmail.service.js';

export class GmailProvider implements IEmailProvider<GmailOAuthAccessTokenResponse, GmailUserProfile, Partial<GmailMessageObjectFull>> {
    private gmailService: GmailService;

    constructor() {
        this.gmailService = new GmailService();
    }

    async getAccessTokenFromCode(code: string): Promise<GmailOAuthAccessTokenResponse> {
        return this.gmailService.getAccessTokenFromCode(code);
    }

    async getUserProfileFromAccessToken(accessToken: string): Promise<GmailUserProfile> {
        return this.gmailService.getUserProfileFromAccessToken(accessToken);
    }

    async fetchMessages(accountId: string, cursor?: string): Promise<SyncResult | null> {
        if (cursor) {
            const historyDetails = await this.gmailService.getMessagesAfterLastHistory(accountId, cursor);
            if (!historyDetails) return null;
            return {
                addedEmails: historyDetails.addedMessages,
                deletedEmailIds: historyDetails.deletedMessages,
                newCursor: historyDetails.newHistoryId,
            };
        } else {
            const result = await this.gmailService.getMessages(accountId);
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
        const emails = await this.gmailService.getMessagesByMessagesId(accountId, [emailId]);
        if (!emails.length) {
            throw new Error(`Email details not found for message ID: ${emailId}`);
        }
        return emails[0];
    }

    async deleteEmails(emailIds: string[], accountId: string, trash?: boolean): Promise<void> {
        await this.gmailService.deleteEmails(emailIds, accountId, trash);
    }

    async archiveEmails(emailIds: string[], accountId: string, archive: boolean): Promise<void> {
        await this.gmailService.archiveEmails(emailIds, accountId, archive);
    }

    async unreadEmails(emailIds: string[], accountId: string, unread: boolean): Promise<void> {
        await this.gmailService.unreadEmails(emailIds, accountId, unread);
    }

    async starEmails(emails: { id: string; providerMessageId: string }[], accountId: string, star: boolean): Promise<void> {
        await this.gmailService.starEmails(emails, accountId, star);
    }

    async sendMail(composeEmailData: ComposeEmailBody): Promise<Partial<GmailMessageObjectFull>> {
        return this.gmailService.sendMessage(composeEmailData);
    }

    async searchContacts(accountId: string, searchText: string): Promise<SearchOtherContactsResponse[]> {
        return this.gmailService.searchContacts(accountId, searchText);
    }

    async getAttachment(accountId: string, messageId: string, attachmentId: string): Promise<{ data: Buffer; mimeType: string; filename: string }> {
        return this.gmailService.getAttachment(accountId, messageId, attachmentId);
    }

    async getAllFolders(accountId: string, userId: string): Promise<Partial<FolderInput>[]> {
        return this.gmailService.getAllLabels(accountId, userId);
    }

    async createFolder(userId: string, accountId: string, folderName: string): Promise<UpdateAPIResponse> {
        return this.gmailService.createLabel(userId, accountId, folderName);
    }

    async updateFolder(accountId: string, folderId: string, folderName: string): Promise<UpdateAPIResponse> {
        return this.gmailService.updateLabel(accountId, folderId, folderName);
    }

    async deleteFolder(accountId: string, folderId: string): Promise<UpdateAPIResponse> {
        return this.gmailService.deleteLabel(accountId, folderId);
    }

    async refreshAccessToken(accountId: string): Promise<string> {
        const account = await AccountRepository.getAccountById(accountId);
        if (!account) {
            throw new Error(`Account not found for token refresh: ${accountId}`);
        }
        return GmailApi.refreshAccessToken(accountId, decrypt(account.refreshToken));
    }

    async moveEmails(emailIds: string[], accountId: string, targetFolderIds: string[], removeFolderIds?: string[]): Promise<void> {
        await this.gmailService.moveEmails(emailIds, accountId, targetFolderIds, removeFolderIds || []);
    }
}
