// src/shared/constants/messages.ts

export const MESSAGES = {
    // Settings
    SETTINGS: {
        PASSWORD_UPDATE_SUCCESS: 'Password updated successfully',
        PROFILE_UPDATE_SUCCESS: 'Profile updated successfully',
    },

    // Accounts Messages
    ACCOUNTS: {
        ACCOUNTS_LOAD_ERROR: 'Error loading accounts',
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
        EMAIL_LOAD_ERROR: 'Error loading emails',
        SEND_EMAIL_SUCCESS: 'Email sent successfully',
        SEND_EMAIL_ERROR: 'Failed to send email, please try again!',
    },
} as const;

export const DASHBOARD_LABELS = {
    LABEL: 'Dashboard',
    DESCRIPTION: 'Overview of email volume, response trends, and mailbox activity.',
    ALL_ACCOUNTS_CONNECTED: 'All Connected Accounts',
    EMAIL_VOLUME_CHART: {
        LABEL: 'Email Volume Trends',
        DESCRIPTION: 'Daily breakdown comparing received vs. outgoing sent message velocity.',
        NO_DATA: 'No email volume data recorded for this timeframe.',
    },
    RESPONSE_TIME_CARD: {
        LABEL: 'Turnaround & Response',
        DESCRIPTION: 'Communication responsiveness measured across active thread conversations.',
        NO_DATA: 'No response time data recorded for this timeframe.',
        AVERAGE_REPLY: 'Average Reply',
        MEDIAN_REPLY: 'Median Reply',
        TURNAROUND_DISTRIBUTION: 'Turnaround Distribution',
        TOTAL_REPLIES_ANALYZED: 'Total Replies Analyzed',
    },
    TOP_SENDERS_CARD: {
        LABEL: 'Top Senders',
        DESCRIPTION: 'Accounts sending the highest volume of emails over the selected period.',
        NO_DATA: 'No incoming sender data for this timeframe.',
        SENT_MESSAGE: 'Sent Message',
    },
    ACCOUNT_ACTIVITY: {
        LABEL: 'Connected Mailbox Activity',
        DESCRIPTION: 'Operational snapshot of message storage, unread counts, and synchronization health per mailbox.',
        NO_DATA: 'No active connected accounts found.',
    },
    ACCOUNT_DISTRIBUTION_PIE_CHART: {
        LABEL: 'Account Email Distribution',
        DESCRIPTION: 'Share of total emails across connected mailboxes.',
        NO_DATA: 'No account email distribution data recorded.',
        TOTAL_EMAILS: 'Total Emails',
        PERCENTAGE: 'Share',
    },
} as const;

export const EMAIL_LABELS = {
    KEYBOARD_SHORTCUTS: {
        LABEL: 'Keyboard Shortcuts',
        DESCRIPTION: 'Press these shortcut keys anywhere in your mailbox to trigger quick actions.',
    },
} as const;

export const USER_AI_SETTINGS_LABELS = {
    GLOBAL_AI_TOGGLE: {
        LABEL: 'MailSense AI Engine',
        DESCRIPTION: 'Power smart categorization, priority inbox scoring, and automated thread summaries.',
        PRIVACY_POLICY:
            'Privacy Guaranteed: Email content is processed ephemerally using Google Gemini 3.6 Flash. No email data is stored by LLMs or used for model training.',
    },
    AI_FEATURES_TOGGLES: {
        LABEL: 'Granular AI Capabilities',
        DESCRIPTION: 'Customize which AI features execute during synchronization and conversation view.',
    },
    PER_ACCOUNT_AI_EXCLUSION: {
        LABEL: 'Connected Account Controls',
        DESCRIPTION: 'Exclude specific accounts (e.g. sensitive internal or compliance mailboxes) from AI processing.',
        DISABLED_ACCOUNTS: (no: number) => `${no} account(s) excluded: Inbound emails to these accounts bypass AI ingestion completely.`,
    },
} as const;
