import { DATE_RANGE } from '@types';
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
    folders: string[];
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
    searchText?: string | undefined;
    accountId?: string[] | undefined;
    dateRange?: DATE_RANGE | undefined;
    folders?: string[] | undefined;
    unread?: boolean | undefined;
}

export interface SearchOtherContactsResponse {
    name: string;
    email: string;
}

export interface GetFiltersResponse {
    accounts: { id: string; provider: string; emailAddress: string }[];
    folders: { id: string; name: string; providerFolderId: string }[];
}
