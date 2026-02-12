// Base API URL (backend)
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Auth0 related URLs
export const AUTH0_URLS = {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    CALLBACK: '/auth/callback',
    PROFILE: '/auth/profile',
} as const;
