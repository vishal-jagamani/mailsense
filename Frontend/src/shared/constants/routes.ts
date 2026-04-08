export const ROUTES = {
    GET_STARTED: '/get_started',
    HOME: '/',
    LOGIN: '/login',
    DASHBOARD: '/dashboard',
    SETTINGS: '/settings',
    ACCOUNTS: '/accounts',
} as const;

export const HOME_ROUTES = {
    UNIFIED_INBOX: '/inbox',
    ACCOUNT_INBOX: (id: string) => `/inbox/${id}`,
    EMAIL: (accountId: string, emailId: string) => `/inbox/${accountId}/email/${emailId}`,
    ALL_FOLDERS: '/folders',
    ACCOUNT_FOLDERS: (id: string) => `/folders/${id}`,
    FOLDER: (accountId: string, folderId: string) => `/folders/${accountId}/${folderId}`,
} as const;
