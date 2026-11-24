import { EmailAttachment, EmailListDTO } from '@mailsense/types';
import { AccountDocument } from '@modules/accounts/database/index.js';
import { ProjectionType, SortOrder } from 'mongoose';
import { EmailDocument } from '../database/index.js';

// DB Field Mapping
export interface EmailListDBFieldMapping {
    LIST: { projection: ProjectionType<EmailDocument> };
    SORT: { sort: Record<string, SortOrder> };
}

export interface ComposeEmailAttachment {
    filename: string;
    mimeType: string;
    buffer: Buffer;
}

export interface AuthorizedAttachmentContext {
    email: EmailDocument;
    account: AccountDocument;
}

export interface AttachmentMetadata {
    mimeType: string;
    filename: string;
}

export interface EmailListItem extends EmailListDTO {
    attachments?: EmailAttachment[];
    folders: string[];
}

export interface ThreadSummaryItem {
    threadId: string;
    count: number;
    latestAt: Date;
}

export interface GroupedEmailThreadItem {
    threadCount: number;
}

export interface PaginationParams {
    size: string;
    page: string;
}
