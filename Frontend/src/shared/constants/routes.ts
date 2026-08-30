export const ROUTES = {
    GET_STARTED: '/get_started',
    SETTINGS: '/settings',
    ACCOUNTS: '/accounts',
} as const;

export const HOME_ROUTES = {
    // Dashboard route
    DASHBOARD: '/',
    // Unified inbox routes
    UNIFIED_INBOX: '/inbox',
    ACCOUNT_INBOX: (id: string) => `/inbox/${id}`,
    EMAIL: (accountId: string, emailId: string) => `/inbox/${accountId}/email/${emailId}`,
    // Draft routes
    DRAFTS: '/drafts',
    // Starred routes
    STARRED: '/starred',
    ACCOUNT_STARRED: (accountId: string) => `/starred/${accountId}`,
    // Folder routes
    ALL_FOLDERS: '/folders',
    ACCOUNT_FOLDERS: (id: string) => `/folders/${id}`,
    FOLDER: (accountId: string, folderId: string) => `/folders/${accountId}/${folderId}`,
} as const;
