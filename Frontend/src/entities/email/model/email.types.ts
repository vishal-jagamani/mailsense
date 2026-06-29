import { Filter } from '@shared/types';

export interface FetchEmailRequestOptions {
    userId: string;
    size: number;
    page: number;
    filters: Filter;
}

export interface Email {
    _id: string;
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

export interface ComposeEmailRequestBody {
    accountId: string;
    to: string[];
    subject: string;
    body: string;
}

export interface SearchOtherContactsResponse {
    name: string;
    email: string;
}

export interface GetFiltersResponse {
    accounts: { id: string; provider: string; emailAddress: string }[];
    folders: { id: string; name: string; providerFolderId: string }[];
}
