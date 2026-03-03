export const OUTLOOK_TOKEN_URI = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

export const OUTLOOK_API_BASE_URL = 'https://graph.microsoft.com/v1.0';

export const OUTLOOK_APIs = {
    PROFILE: '/me',
    MESSAGES: '/me/mailFolders/Inbox/messages',
    MESSAGES_DELTA: '/me/mailFolders/Inbox/messages/delta',
};

export const OUTLOOK_API_PARAMS = {
    DELTA_MESSAGES_FIELD: 'id,subject,from,toRecipients,receivedDateTime,isRead,bodyPreview,conversationId',
};
