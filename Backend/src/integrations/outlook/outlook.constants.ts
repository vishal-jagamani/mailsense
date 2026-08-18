export const OUTLOOK_TOKEN_URI = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

export const OUTLOOK_API_BASE_URL = 'https://graph.microsoft.com/v1.0';

export const OUTLOOK_APIs = {
    PROFILE: '/me',
    MESSAGES: '/me/mailFolders/Inbox/messages',
    MESSAGES_DELTA: '/me/mailFolders/Inbox/messages/delta',
    FOLDERS: '/me/mailFolders',
    ATTACHMENTS: (messageId: string) => `/me/messages/${messageId}/attachments`,
    ATTACHMENT: (messageId: string, attachmentId: string) => `/me/messages/${messageId}/attachments/${attachmentId}/$value`,
};

export const OUTLOOK_API_PARAMS = {
    DELTA_MESSAGES_FIELD:
        'id,subject,from,toRecipients,ccRecipients,bccRecipients,receivedDateTime,isRead,bodyPreview,conversationId,hasAttachments,attachments,body',
};

export const OUTLOOK_ATTACHMENT_MAX_DIRECT_SIZE = 3 * 1024 * 1024;
export const OUTLOOK_ATTACHMENT_CHUNK_SIZE = 320 * 1024 * 10;
