import { Email } from './email.types';

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
}
