export const ACCOUNTS_API_ENDPOINTS = {
    PROVIDERS_LIST: '/accounts/providers/list',
    DETAILS: (accountId: string) => `/accounts/${accountId}`,
    LIST_BY_USER: (userId: string) => `/accounts/list/${userId}`,
    CONNECT: (provider: string) => `/accounts/connect/${provider}`,
    SYNC: (accountId: string) => `/accounts/sync/${accountId}`,
    SYNC_ALL: '/accounts/sync-all',
    DELETE: (accountId: string) => `/accounts/${accountId}`,
} as const;
