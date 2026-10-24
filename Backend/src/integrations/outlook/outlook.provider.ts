import { IEmailProvider, SyncResult } from '@integrations/email/email.provider.js';
import { AttachmentStreamResult } from '@integrations/email/email.provider.types.js';
import {
    EmailAttributes,
    OutlookMessageObjectFull,
    OutlookOAuthAccessTokenResponse,
    OutlookUserProfile,
    SearchOtherContactsResponse,
    UpdateAPIResponse,
} from '@mailsense/types';
import { EmailDocument, EmailInput } from '@modules/emails/email.model.js';
import { ComposeEmailBody } from '@modules/emails/email.schema.js';
import { FolderInput } from '@modules/folders/folder.model.js';
import { OutlookClient } from './clients/index.js';
import { OutlookFolderService, OutlookMailService, OutlookSyncService } from './services/index.js';

export class OutlookProvider implements IEmailProvider<OutlookOAuthAccessTokenResponse, OutlookUserProfile, OutlookMessageObjectFull> {
    constructor(
        private readonly outlookSyncService: OutlookSyncService = new OutlookSyncService(),
        private readonly outlookMailService: OutlookMailService = new OutlookMailService(),
        private readonly outlookFolderService: OutlookFolderService = new OutlookFolderService(),
    ) {}

    async getAccessTokenFromCode(code: string): Promise<OutlookOAuthAccessTokenResponse> {
        return this.outlookSyncService.getAccessTokenFromCode(code);
    }

    async getUserProfileFromAccessToken(accessToken: string): Promise<OutlookUserProfile> {
        return this.outlookSyncService.getUserProfileFromAccessToken(accessToken);
    }

    async fetchMessages(accountId: string, cursor?: string): Promise<SyncResult | null> {
        if (cursor) {
            const historyDetails = await this.outlookSyncService.getMessagesAfterLastDelta(accountId, cursor);
            if (!historyDetails) return null;
            return {
                addedEmails: historyDetails.addedEmails,
                deletedEmailIds: historyDetails.deletedEmailIds,
                newCursor: historyDetails.newDeltaLink,
            };
        } else {
            const result = await this.outlookMailService.getMessages(accountId);
            return {
                addedEmails: result.emails,
                deletedEmailIds: [],
                newCursor: result.deltaLink,
            };
        }
    }

    async getMessageDetails(accountId: string, emailId: string, dbEmail?: EmailDocument): Promise<EmailAttributes | EmailInput> {
        return this.outlookMailService.getMessageDetails(accountId, emailId, dbEmail);
    }

    async getAttachment(accountId: string, messageId: string, attachmentId: string): Promise<{ data: Buffer; mimeType: string; filename: string }> {
        return this.outlookMailService.getAttachment(accountId, messageId, attachmentId);
    }

    async getAttachmentStream(accountId: string, messageId: string, attachmentId: string): Promise<AttachmentStreamResult> {
        return await this.outlookMailService.getAttachmentStream(accountId, messageId, attachmentId);
    }

    async deleteEmails(emailIds: string[], accountId: string, trash?: boolean): Promise<void> {
        await this.outlookMailService.deleteEmails(emailIds, accountId, trash);
    }

    async archiveEmails(emailIds: string[], accountId: string, archive: boolean): Promise<void> {
        await this.outlookMailService.archiveEmails(emailIds, accountId, archive);
    }

    async unreadEmails(emailIds: string[], accountId: string, unread: boolean): Promise<void> {
        await this.outlookMailService.unreadEmails(emailIds, accountId, unread);
    }

    async starEmails(emails: { id: string; providerMessageId: string }[], accountId: string, star: boolean): Promise<void> {
        const providerMessageIds = emails.map((email) => email.providerMessageId);
        await this.outlookMailService.flagEmails(providerMessageIds, accountId, star);
    }

    async sendMail(composeEmailData: ComposeEmailBody): Promise<OutlookMessageObjectFull> {
        return this.outlookMailService.sendMail(composeEmailData);
    }

    async searchContacts(accountId: string, searchText: string): Promise<SearchOtherContactsResponse[]> {
        return this.outlookMailService.searchContacts(accountId, searchText);
    }

    async getAllFolders(accountId: string, userId: string): Promise<Partial<FolderInput>[]> {
        return this.outlookFolderService.getAllFolders(accountId, userId);
    }

    async createFolder(userId: string, accountId: string, folderName: string): Promise<UpdateAPIResponse> {
        return this.outlookFolderService.createFolder(userId, accountId, folderName, false);
    }

    async updateFolder(accountId: string, folderId: string, folderName: string): Promise<UpdateAPIResponse> {
        return this.outlookFolderService.updateFolder(accountId, folderId, folderName);
    }

    async deleteFolder(accountId: string, folderId: string): Promise<UpdateAPIResponse> {
        return this.outlookFolderService.deleteFolder(accountId, folderId);
    }

    async refreshAccessToken(accountId: string): Promise<string> {
        return OutlookClient.refreshAccessToken(accountId);
    }

    async moveEmails(emailIds: string[], accountId: string, targetFolderIds: string[], _removeFolderIds?: string[]): Promise<UpdateAPIResponse> {
        return await this.outlookMailService.moveEmails(emailIds, accountId, targetFolderIds);
    }
}
