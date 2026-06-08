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

    // Accounts Messages
    ACCOUNTS: {
        INFO_CARD: {
            TITLE: '🚀 More connectors are on the way',
            DESCRIPTION: `✨Outlook is now available! We're working on bringing more email providers to you soon.`,
            GET_STARTED: `💡 To get started, click "Connect Account" in the header and select your provider.`,
        },
    },

    // Folders Messages
    FOLDERS: {
        CREATE_FOLDERS_SUCCESS: 'Folder created successfully',
        CREATE_FOLDER_ERROR: 'Failed to create folder, please try again!',
        UPDATE_FOLDER_SUCCESS: 'Folder updated successfully',
        UPDATE_FOLDER_ERROR: 'Failed to update folder, please try again!',
        UPDATE_FOLDER_SAME_NAME_ERROR: 'Folder with same name already exists, please try again with other name!',
        DELETE_FOLDER_SUCCESS: 'Folder deleted successfully',
        DELETE_FOLDER_ERROR: 'Failed to delete folder, please try again!',
        FOLDER_LOAD_ERROR: 'Error loading folder',
    },

    // Emails Messages
    EMAILS: {
        SEND_EMAIL_SUCCESS: 'Email sent successfully',
        SEND_EMAIL_ERROR: 'Failed to send email, please try again!',
    },
} as const;
