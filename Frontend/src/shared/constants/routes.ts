export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    DASHBOARD: '/dashboard',
    SETTINGS: '/settings',
    UNIFIED_INBOX: '/inbox',
    EMAIL_DETAIL: (id: string) => `/inbox/${id}`, // dynamic route helper
};
