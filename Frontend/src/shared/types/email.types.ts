import { GetAllEmailsFilters } from './inbox.types';

export interface FetchEmailRequestOptions {
    userId: string;
    size: number;
    page: number;
    filters: GetAllEmailsFilters;
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

export interface GetEmailsResponse {
    data: Email[];
    size: number;
    page: number;
    total: number;
}
