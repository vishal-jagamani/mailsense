export interface InboxSearchResultResponse {
    data: Email[];
    size: number;
    page: number;
    total: number;
}

export enum DATE_RANGE {
    TODAY = 'today',
    LAST_WEEK = 'last_week',
    LAST_MONTH = 'last_month',
    LAST_3_MONTHS = 'last_3_months',
    ALL_TIME = 'all_time',
}

export interface GetAllEmailsFilters {
    searchText?: string | undefined;
    accountId?: string[] | undefined;
    dateRange?: DATE_RANGE | undefined;
    folders?: string[] | undefined;
}

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
