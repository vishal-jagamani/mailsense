import { IEmailProvider, SyncResult } from '@integrations/email/email.provider.js';
import {
    OutlookMessageObjectFull,
    OutlookOAuthAccessTokenResponse,
    OutlookUserProfile,
    SearchOtherContactsResponse,
    UpdateAPIResponse,
} from '@mailsense/types';
import { EmailInput } from '@modules/emails/email.model.js';
import { ComposeEmailBody } from '@modules/emails/email.schema.js';
import { FolderInput } from '@modules/folders/folder.model.js';
import { OutlookApi } from './outlook.api.js';
import { OutlookService } from './outlook.service.js';

export class OutlookProvider implements IEmailProvider<OutlookOAuthAccessTokenResponse, OutlookUserProfile, OutlookMessageObjectFull> {
    private outlookService: OutlookService;

    constructor() {
        this.outlookService = new OutlookService();
    }

    async getAccessTokenFromCode(code: string): Promise<OutlookOAuthAccessTokenResponse> {
        return this.outlookService.getAccessTokenFromCode(code);
    }

    async getUserProfileFromAccessToken(accessToken: string): Promise<OutlookUserProfile> {
        return this.outlookService.getUserProfileFromAccessToken(accessToken);
    }

    async fetchMessages(accountId: string, cursor?: string): Promise<SyncResult | null> {
        if (cursor) {
            const historyDetails = await this.outlookService.getMessagesAfterLastDelta(accountId, cursor);
            if (!historyDetails) return null;
            return {
                addedEmails: historyDetails.addedEmails,
                deletedEmailIds: historyDetails.deletedEmailIds,
                newCursor: historyDetails.newDeltaLink,
            };
        } else {
            const result = await this.outlookService.getMessages(accountId);
            return {
                addedEmails: result.emails,
                deletedEmailIds: [],
                newCursor: result.deltaLink,
            };
        }
    }

    async getMessageDetails(accountId: string, emailId: string): Promise<EmailInput> {
        return this.outlookService.getMessageDetails(accountId, emailId);
    }

    async deleteEmails(emailIds: string[], accountId: string, trash?: boolean): Promise<void> {
        await this.outlookService.deleteEmails(emailIds, accountId, trash);
    }

    async archiveEmails(emailIds: string[], accountId: string, archive: boolean): Promise<void> {
        await this.outlookService.archiveEmails(emailIds, accountId, archive);
    }

    async unreadEmails(emailIds: string[], accountId: string, unread: boolean): Promise<void> {
        await this.outlookService.unreadEmails(emailIds, accountId, unread);
    }

    async starEmails(emails: { id: string; providerMessageId: string }[], accountId: string, star: boolean): Promise<void> {
        const providerMessageIds = emails.map((email) => email.providerMessageId);
        await this.outlookService.flagEmails(providerMessageIds, accountId, star);
    }

    async sendMail(composeEmailData: ComposeEmailBody): Promise<OutlookMessageObjectFull> {
        return this.outlookService.sendMail(composeEmailData);
    }

    async searchContacts(accountId: string, searchText: string): Promise<SearchOtherContactsResponse[]> {
        return this.outlookService.searchContacts(accountId, searchText);
    }

    async getAllFolders(accountId: string, userId: string): Promise<Partial<FolderInput>[]> {
        return this.outlookService.getAllFolders(accountId, userId);
    }

    async createFolder(userId: string, accountId: string, folderName: string): Promise<UpdateAPIResponse> {
        return this.outlookService.createFolder(userId, accountId, folderName, false);
    }

    async updateFolder(accountId: string, folderId: string, folderName: string): Promise<UpdateAPIResponse> {
        return this.outlookService.updateFolder(accountId, folderId, folderName);
    }

    async deleteFolder(accountId: string, folderId: string): Promise<UpdateAPIResponse> {
        return this.outlookService.deleteFolder(accountId, folderId);
    }

    async refreshAccessToken(accountId: string): Promise<string> {
        return OutlookApi.refreshAccessToken(accountId);
    }
}
