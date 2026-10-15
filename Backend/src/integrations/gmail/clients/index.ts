import { GmailAttachmentClient } from './gmail-attachment.client.js';
import { GmailAuthClient } from './gmail-auth.client.js';
import { GmailFolderClient } from './gmail-contacts.client.js';
import { GmailMailClient } from './gmail-mail.client.js';

export class GmailClient {
    // Gmail auth client
    public static readonly getAccessTokenFromCode = GmailAuthClient.getAccessTokenFromCode;
    public static readonly fetchAccessToken = GmailAuthClient.fetchAccessToken;
    public static readonly refreshAccessToken = GmailAuthClient.refreshAccessToken;
    public static readonly getUserProfileFromAccessToken = GmailAuthClient.getUserProfileFromAccessToken;

    // Gmail mail client
    public static readonly getHistory = GmailMailClient.getHistory;
    public static readonly fetchEmails = GmailMailClient.fetchEmails;
    public static readonly fetchEmailById = GmailMailClient.fetchEmailById;
    public static readonly trashEmail = GmailMailClient.trashEmail;
    public static readonly permanentlyDeleteEmails = GmailMailClient.permanentlyDeleteEmails;
    public static readonly archiveEmail = GmailMailClient.archiveEmail;
    public static readonly starEmail = GmailMailClient.starEmail;
    public static readonly unreadEmail = GmailMailClient.unreadEmail;
    public static readonly sendMessage = GmailMailClient.sendMessage;
    public static readonly batchModifyLabels = GmailMailClient.batchModifyLabels;
    public static readonly searchContacts = GmailMailClient.searchContacts;

    // Gmail folder client
    public static readonly getAllLabels = GmailFolderClient.getAllLabels;
    public static readonly getLabelDetails = GmailFolderClient.getLabelDetails;
    public static readonly createLabel = GmailFolderClient.createLabel;
    public static readonly updateLabel = GmailFolderClient.updateLabel;
    public static readonly deleteLabel = GmailFolderClient.deleteLabel;

    // Gmail attachment client
    public static readonly getAttachment = GmailAttachmentClient.getAttachment;
    public static readonly getAttachmentStream = GmailAttachmentClient.getAttachmentStream;
}

export { GmailAttachmentClient, GmailAuthClient, GmailFolderClient, GmailMailClient };
