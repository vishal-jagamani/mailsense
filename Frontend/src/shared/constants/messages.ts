// src/shared/constants/messages.ts

export const MESSAGES = {
    // Auth
    LOGIN_SUCCESS: 'You have logged in successfully.',
    LOGOUT_SUCCESS: 'You have been logged out.',
    AUTH_ERROR: 'Authentication failed. Please try again.',

    // Account
    ACCOUNTS_LOAD_ERROR: 'Error loading accounts',

    // Email
    EMAIL_SYNC_STARTED: 'Syncing your emails...',
    EMAIL_SYNC_SUCCESS: 'Emails synced successfully.',
    EMAIL_SYNC_ERROR: 'Failed to sync emails. Please check your connection.',

    // AI
    AI_SUMMARY_LOADING: 'Generating AI summary...',
    AI_SUMMARY_ERROR: 'Failed to generate AI summary. Please try again.',

    // Generic
    ERROR_GENERIC: 'Something went wrong. Please try again later.',
    NETWORK_ERROR: 'Network connection lost. Please check your internet.',

    // Email Loading
    EMAIL_LOAD_ERROR: 'Error loading emails',

    // Settings
    PASSWORD_UPDATE_SUCCESS: 'Password updated successfully',
    PROFILE_UPDATE_SUCCESS: 'Profile updated successfully',
} as const;
