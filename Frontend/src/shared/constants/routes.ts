export const ROUTES = {
    GET_STARTED: '/get_started',
    HOME: '/',
    LOGIN: '/login',
    DASHBOARD: '/dashboard',
    SETTINGS: '/settings',
};

export const HOME_ROUTES = {
    UNIFIED_INBOX: '/inbox',
    EMAIL_DETAIL: (id: string) => `/inbox/${id}`,
};
