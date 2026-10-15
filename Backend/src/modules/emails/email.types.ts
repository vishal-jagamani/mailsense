import { ProjectionType, SortOrder } from 'mongoose';
import { EmailDocument } from './email.model.js';

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

export interface ThreadSummaryItem {
    threadId: string;
    count: number;
    latestAt: Date;
}

export interface GroupedEmailThreadItem {
    threadCount: number;
}
