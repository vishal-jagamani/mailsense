export const AUTH0_URLS = {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    CALLBACK: '/auth/callback',
    PROFILE: '/auth/profile',
} as const;

export const AUTH_API_ENDPOINTS = {
    PROFILE: '/profile',
} as const;

export const ACCOUNTS_API_ENDPOINTS = {
    PROVIDERS_LIST: '/accounts/providers/list',
    DETAILS: (accountId: string) => `/accounts/${accountId}`,
    LIST_BY_USER: '/accounts/list/all',
    CONNECT: (provider: string) => `/accounts/connect/${provider}`,
    SYNC: (accountId: string) => `/accounts/sync/${accountId}`,
    SYNC_ALL: '/accounts/sync-all',
    DELETE: (accountId: string) => `/accounts/${accountId}`,
    ENABLE: (accountId: string) => `/accounts/enable/${accountId}`,
    UPDATE_SETTINGS: (accountId: string) => `/accounts/settings/${accountId}`,
} as const;

export const EMAILS_API_ENDPOINTS = {
    LIST: '/emails/list',
    SEARCH: '/emails/search',
    FILTERS: '/emails/filters',
    DELETE: '/emails/delete',
    DETAILS: (emailId: string) => `/emails/details/${emailId}`,
    ARCHIVE: '/emails/archive',
    STAR: '/emails/star',
    UNREAD: '/emails/unread',
    COMPOSE: '/emails/compose',
    SEARCH_OTHER_CONTACTS: '/emails/searchOtherContacts',
    THREAD: (emailId: string) => `/emails/thread/${emailId}`,
    MOVE: '/emails/move',
} as const;

export const FOLDER_API_ENDPOINTS = {
    GET_ALL_FOLDERS: '/folders/list',
    FOLDERS: '/folders',
} as const;

export const SETTINGS_API_ENDPOINTS = {
    USERS: '/users',
    CHANGE_PASSWORD: '/users/change-password',
    USER_SETTINGS: '/users/settings',
} as const;

export const DRAFTS_API_ENDPOINTS = {
    BASE: '/drafts',
    SAVE: '/drafts/save',
    DETAILS: (draftId: string) => `/drafts/${draftId}`,
    SEND: (draftId: string) => `/drafts/${draftId}/send`,
} as const;
