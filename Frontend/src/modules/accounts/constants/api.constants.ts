export const ACCOUNTS_API_ENDPOINTS = {
    PROVIDERS_LIST: '/accounts/providers/list',
    DETAILS: (accountId: string) => `/accounts/${accountId}`,
    LIST_BY_USER: '/accounts/list/all',
    CONNECT: (provider: string) => `/accounts/connect/${provider}`,
    SYNC: (accountId: string) => `/accounts/sync/${accountId}`,
    SYNC_ALL: '/accounts/sync-all',
    DELETE: (accountId: string) => `/accounts/${accountId}`,
    ENABLE: (accountId: string) => `/accounts/enable/${accountId}`,
} as const;
