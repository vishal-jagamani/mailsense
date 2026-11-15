import { AttachmentStreamResult, IEmailProvider, SyncResult } from '@integrations/email/index.js';
import {
    EmailAttributes,
    OutlookMessageObjectFull,
    OutlookOAuthAccessTokenResponse,
    OutlookUserProfile,
    SearchOtherContactsResponse,
    UpdateAPIResponse,
} from '@mailsense/types';
import { EmailDocument, EmailInput } from '@modules/emails/database/index.js';
import { ComposeEmailBody } from '@modules/emails/schema/index.js';
import { FolderInput } from '@modules/folders/database/index.js';
import { OutlookClient } from './clients/index.js';
import { OutlookAttachmentBufferResult, OutlookMessageIdParam } from './outlook.types.js';
import { OutlookFolderService, OutlookMailReadService, OutlookMailWriteService, OutlookSyncService } from './services/index.js';

export class OutlookProvider implements IEmailProvider<OutlookOAuthAccessTokenResponse, OutlookUserProfile, OutlookMessageObjectFull> {
    constructor(
        private readonly outlookSyncService: OutlookSyncService = new OutlookSyncService(),
        private readonly outlookMailReadService: OutlookMailReadService = new OutlookMailReadService(),
        private readonly outlookMailWriteService: OutlookMailWriteService = new OutlookMailWriteService(),
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
            const result = await this.outlookMailReadService.getMessages(accountId);
            return {
                addedEmails: result.emails,
                deletedEmailIds: [],
                newCursor: result.deltaLink,
            };
        }
    }

    async getMessageDetails(accountId: string, emailId: string, dbEmail?: EmailDocument): Promise<EmailAttributes | EmailInput> {
        return this.outlookMailReadService.getMessageDetails(accountId, emailId, dbEmail);
    }

    async getAttachment(accountId: string, messageId: string, attachmentId: string): Promise<OutlookAttachmentBufferResult> {
        return this.outlookMailReadService.getAttachment(accountId, messageId, attachmentId);
    }

    async getAttachmentStream(accountId: string, messageId: string, attachmentId: string): Promise<AttachmentStreamResult> {
        return await this.outlookMailReadService.getAttachmentStream(accountId, messageId, attachmentId);
    }

    async deleteEmails(emailIds: string[], accountId: string, trash?: boolean): Promise<void> {
        await this.outlookMailWriteService.deleteEmails(emailIds, accountId, trash);
    }

    async archiveEmails(emailIds: string[], accountId: string, archive: boolean): Promise<void> {
        await this.outlookMailWriteService.archiveEmails(emailIds, accountId, archive);
    }

    async unreadEmails(emailIds: string[], accountId: string, unread: boolean): Promise<void> {
        await this.outlookMailWriteService.unreadEmails(emailIds, accountId, unread);
    }

    async starEmails(emails: OutlookMessageIdParam[], accountId: string, star: boolean): Promise<void> {
        const providerMessageIds = emails.map((email) => email.providerMessageId);
        await this.outlookMailWriteService.flagEmails(providerMessageIds, accountId, star);
    }

    async sendMail(composeEmailData: ComposeEmailBody): Promise<OutlookMessageObjectFull> {
        return this.outlookMailWriteService.sendMail(composeEmailData);
    }

    async searchContacts(accountId: string, searchText: string): Promise<SearchOtherContactsResponse[]> {
        return this.outlookMailReadService.searchContacts(accountId, searchText);
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
        return await this.outlookMailWriteService.moveEmails(emailIds, accountId, targetFolderIds);
    }
}
