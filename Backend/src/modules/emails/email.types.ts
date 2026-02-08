import { ProjectionType, SortOrder } from 'mongoose';
import { EmailDocument } from './email.model.js';

// Model types
export interface EmailAttributes {
    accountId: string;
    providerMessageId: string;
    threadId: string;
    from: string;
    to: string[] | string;
    cc: string[] | string;
    bcc: string[] | string;
    subject: string;
    body: string;
    bodyHtml: string;
    bodyPlain: string;
    receivedAt: Date;
    isRead: boolean;
    folder: string;
}

// DB Field Mapping
export interface EmailListDBFieldMapping {
    LIST: { projection: ProjectionType<EmailDocument> };
    SORT: { sort: Record<string, SortOrder> };
}

// Function types
export interface SearchEmailsParams {
    userId: string;
    searchText: string;
    size: number;
    page: number;
}

export interface GetAllEmailsFilters {
    searchText: string | undefined;
    accountId: string[] | undefined;
    dateRange:
        | {
              startDate: Date;
              endDate: Date;
          }
        | undefined;
}
