export const QUERY_KEYS = {
    AUTH: 'auth',
    ACCOUNTS: 'accounts',
    ACCOUNT_PROVIDERS: 'account-providers',
    ACCOUNT_DETAILS: 'account-details',
    EMAIL: 'email',
    USER_PROFILE_SETTINGS: 'user-profile-settings',
    USER_SYNC_SETTINGS: 'user-sync-settings',
};

export const EMAILS = 'emails';

export const EMAIL_FILTERS = 'email-filters';

export const FOLDER_KEYS = {
    FOLDERS: 'folders',
};

export const DRAFT_QUERY_KEYS = {
    all: ['drafts'],
    list: () => [...DRAFT_QUERY_KEYS.all, 'list'],
    detail: (draftId: string) => [...DRAFT_QUERY_KEYS.all, 'detail', draftId],
} as const;
