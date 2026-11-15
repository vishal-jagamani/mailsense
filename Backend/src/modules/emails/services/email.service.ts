import { AttachmentStreamResult } from '@integrations/email/index.js';
import { GmailAttachmentBufferResult } from '@integrations/gmail/gmail.types.js';
import {
    APIResponse,
    GetAllEmailsFilters,
    GetEmailsResponse,
    GetFiltersResponse,
    GetThreadResponse,
    PaginatedDataResponse,
    SearchEmailsParams,
    SearchOtherContactsResponse,
    SuccessAPIResponse,
    UpdateAPIResponse,
} from '@mailsense/types';
import { EmailDocument, EmailInput } from '../database/index.js';
import { ComposeEmailBody } from '../schema/index.js';
import { EmailAttachmentService } from './email-attachment.service.js';
import { EmailQueryService } from './email-query.service.js';
import { EmailThreadService } from './email-thread.service.js';
import { EmailWriteService } from './email-write.service.js';

export class EmailService {
    constructor(
        private readonly queryService: EmailQueryService = new EmailQueryService(),
        private readonly threadService: EmailThreadService = new EmailThreadService(),
        private readonly attachmentService: EmailAttachmentService = new EmailAttachmentService(),
        private readonly writeService: EmailWriteService = new EmailWriteService(),
    ) {}

    // ==========================================
    // Read Delegations -> EmailReadService
    // ==========================================

    public async getAllEmails(userId: string, size: number, page: number, filters: GetAllEmailsFilters): Promise<GetEmailsResponse> {
        return await this.queryService.getAllEmails(userId, size, page, filters);
    }
    public async getEmails(userId: string, accountId: string, size: number, page: number): Promise<GetEmailsResponse> {
        return await this.queryService.getEmails(userId, accountId, size, page);
    }

    public async getFilters(userId: string): Promise<GetFiltersResponse> {
        return await this.queryService.getFilters(userId);
    }

    public async getEmail(userId: string, emailId: string): Promise<EmailDocument | EmailInput | null> {
        return await this.threadService.getEmail(userId, emailId);
    }

    public async searchEmails(params: SearchEmailsParams): Promise<PaginatedDataResponse<EmailDocument>> {
        return await this.queryService.searchEmails(params);
    }

    public async searchOtherContacts(userId: string, searchText: string): Promise<APIResponse<SearchOtherContactsResponse[]>> {
        return await this.queryService.searchOtherContacts(userId, searchText);
    }

    public async getThread(userId: string, emailId: string): Promise<GetThreadResponse> {
        return await this.threadService.getThread(userId, emailId);
    }

    public async downloadAttachment(userId: string, emailId: string, attachmentId: string): Promise<GmailAttachmentBufferResult> {
        return await this.attachmentService.downloadAttachment(userId, emailId, attachmentId);
    }

    public async downloadAttachmentStream(userId: string, emailId: string, attachmentId: string): Promise<AttachmentStreamResult> {
        return await this.attachmentService.downloadAttachmentStream(userId, emailId, attachmentId);
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
    ): Promise<UpdateAPIResponse> {
        return await this.writeService.moveEmails(userId, emailIds, targetFolderIds, removeFolderIds);
    }
}
