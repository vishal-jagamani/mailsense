import { AttachmentStreamResult } from '@integrations/email/email.provider.types.js';
import {
    APIResponse,
    GetAllEmailsFilters,
    GetEmailsResponse,
    GetFiltersResponse,
    GetThreadResponse,
    MoveEmailsResponse,
    PaginatedDataResponse,
    SearchEmailsParams,
    SearchOtherContactsResponse,
    SuccessAPIResponse,
    UpdateAPIResponse,
} from '@mailsense/types';
import { EmailReadService } from './email-read.service.js';
import { EmailWriteService } from './email-write.service.js';
import { EmailDocument, EmailInput } from './email.model.js';
import { ComposeEmailBody } from './email.schema.js';

export class EmailService {
    private readService: EmailReadService;
    private writeService: EmailWriteService;

    constructor(readService?: EmailReadService, writeService?: EmailWriteService) {
        this.readService = readService || new EmailReadService();
        this.writeService = writeService || new EmailWriteService();
    }

    // ==========================================
    // Read Delegations -> EmailReadService
    // ==========================================

    public async getAllEmails(userId: string, size: number, page: number, filters: GetAllEmailsFilters): Promise<GetEmailsResponse> {
        return await this.readService.getAllEmails(userId, size, page, filters);
    }
    public async getEmails(accountId: string, size: number, page: number): Promise<GetEmailsResponse> {
        return await this.readService.getEmails(accountId, size, page);
    }

    public async getFilters(userId: string): Promise<GetFiltersResponse> {
        return await this.readService.getFilters(userId);
    }

    public async getEmail(emailId: string): Promise<EmailDocument | EmailInput | null> {
        return await this.readService.getEmail(emailId);
    }

    public async searchEmails(params: SearchEmailsParams): Promise<PaginatedDataResponse<EmailDocument>> {
        return await this.readService.searchEmails(params);
    }

    public async searchOtherContacts(userId: string, searchText: string): Promise<APIResponse<SearchOtherContactsResponse[]>> {
        return await this.readService.searchOtherContacts(userId, searchText);
    }

    public async getThread(emailId: string): Promise<GetThreadResponse> {
        return await this.readService.getThread(emailId);
    }

    public async downloadAttachment(emailId: string, attachmentId: string): Promise<{ data: Buffer; mimeType: string; filename: string }> {
        return await this.readService.downloadAttachment(emailId, attachmentId);
    }

    public async downloadAttachmentStream(emailId: string, attachmentId: string): Promise<AttachmentStreamResult> {
        return await this.readService.downloadAttachmentStream(emailId, attachmentId);
    }

    // ==========================================
    // Write Delegations -> EmailWriteService
    // ==========================================

    public async deleteEmail(userId: string, emailIds: string[], trash?: boolean): Promise<UpdateAPIResponse> {
        return await this.writeService.deleteEmail(userId, emailIds, trash);
    }

    public async archiveEmails(userId: string, emailIds: string[], archive: boolean): Promise<UpdateAPIResponse> {
        return await this.writeService.archiveEmails(userId, emailIds, archive);
    }

    public async starEmails(userId: string, emailIds: string[], star: boolean): Promise<UpdateAPIResponse> {
        return await this.writeService.starEmails(userId, emailIds, star);
    }

    public async unreadEmails(userId: string, emailIds: string[], unread: boolean): Promise<UpdateAPIResponse> {
        return await this.writeService.unreadEmails(userId, emailIds, unread);
    }

    public async composeEmail(userId: string, composeEmailData: ComposeEmailBody): Promise<SuccessAPIResponse> {
        return await this.writeService.composeEmail(userId, composeEmailData);
    }

    public async moveEmails(
        userId: string,
        emailIds: string[],
        targetFolderIds: string[],
        removeFolderIds: string[] = [],
    ): Promise<MoveEmailsResponse> {
        return await this.writeService.moveEmails(userId, emailIds, targetFolderIds, removeFolderIds);
    }
}
