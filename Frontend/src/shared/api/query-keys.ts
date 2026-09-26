import { AnalyticsQueryParams, FetchEmailRequestOptions } from '@mailsense/types';

export const QUERY_KEYS = {
    AUTH: 'auth',
    ACCOUNTS: 'accounts',
    ACCOUNT_PROVIDERS: 'account-providers',
    ACCOUNT_DETAILS: 'account-details',
    USER_PROFILE_SETTINGS: 'user-profile-settings',
    USER_SYNC_SETTINGS: 'user-sync-settings',
} as const;

export const FOLDER_KEYS = {
    FOLDERS: 'folders',
} as const;

export const EMAIL_QUERY_KEYS = {
    all: ['emails'] as const,
    lists: () => [...EMAIL_QUERY_KEYS.all, 'list'] as const,
    list: (options?: FetchEmailRequestOptions) => [...EMAIL_QUERY_KEYS.lists(), options] as const,
    filters: () => [...EMAIL_QUERY_KEYS.all, 'filters'] as const,
    details: () => [...EMAIL_QUERY_KEYS.all, 'detail'] as const,
    detail: (emailId: string) => [...EMAIL_QUERY_KEYS.details(), emailId] as const,
    threads: () => [...EMAIL_QUERY_KEYS.all, 'thread'] as const,
    thread: (emailId: string) => [...EMAIL_QUERY_KEYS.threads(), emailId] as const,
} as const;

export const DRAFT_QUERY_KEYS = {
    all: ['drafts'] as const,
    list: () => [...DRAFT_QUERY_KEYS.all, 'list'] as const,
    detail: (draftId: string) => [...DRAFT_QUERY_KEYS.all, 'detail', draftId] as const,
} as const;

export const ANALYTICS_QUERY_KEYS = {
    all: ['analytics'] as const,
    dashboard: (params?: AnalyticsQueryParams) => [...ANALYTICS_QUERY_KEYS.all, 'dashboard', params] as const,
} as const;
