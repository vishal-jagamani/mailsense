import { OutlookAttachmentClient } from './outlook-attachment.client.js';
import { OutlookAuthClient } from './outlook-auth.client.js';
import { OutlookFolderClient } from './outlook-folder.client.js';
import { OutlookMailClient } from './outlook-mail.client.js';

export class OutlookClient {
    // Outlook auth client
    public static readonly getAccessTokenFromCode = OutlookAuthClient.getAccessTokenFromCode;
    public static readonly fetchAccessToken = OutlookAuthClient.fetchAccessToken;
    public static readonly refreshAccessToken = OutlookAuthClient.refreshAccessToken;
    public static readonly getUserProfileFromAccessToken = OutlookAuthClient.getUserProfileFromAccessToken;

    // Outlook mail client
    public static readonly getMessages = OutlookMailClient.getMessages;
    public static readonly getMessagesFromDeltaLink = OutlookMailClient.getMessagesFromDeltaLink;
    public static readonly getMessageDetails = OutlookMailClient.getMessageDetails;
    public static readonly createDraftMessage = OutlookMailClient.createDraftMessage;
    public static readonly sendDraftMessage = OutlookMailClient.sendDraftMessage;
    public static readonly sendMailDirect = OutlookMailClient.sendMailDirect;
    public static readonly flagEmail = OutlookMailClient.flagEmail;
    public static readonly unreadEmail = OutlookMailClient.unreadEmail;
    public static readonly deleteEmail = OutlookMailClient.deleteEmail;
    public static readonly deleteEmailPermanently = OutlookMailClient.deleteEmailPermanently;
    public static readonly archiveEmail = OutlookMailClient.archiveEmail;
    public static readonly unarchiveEmail = OutlookMailClient.unarchiveEmail;
    public static readonly moveMessage = OutlookMailClient.moveMessage;
    public static readonly searchContacts = OutlookMailClient.searchContacts;
    public static readonly createUploadSession = OutlookMailClient.createUploadSession;
    public static readonly uploadChunk = OutlookMailClient.uploadChunk;

    // Outlook folder client
    public static readonly getAllFolders = OutlookFolderClient.getAllFolders;
    public static readonly getFolderDetails = OutlookFolderClient.getFolderDetails;
    public static readonly createFolder = OutlookFolderClient.createFolder;
    public static readonly updateFolder = OutlookFolderClient.updateFolder;
    public static readonly deleteFolder = OutlookFolderClient.deleteFolder;

    // Outlook attachment client
    public static readonly getMessageAttachments = OutlookAttachmentClient.getMessageAttachments;
    public static readonly getAttachment = OutlookAttachmentClient.getAttachment;
    public static readonly getAttachmentStream = OutlookAttachmentClient.getAttachmentStream;
}

export { OutlookAttachmentClient, OutlookAuthClient, OutlookFolderClient, OutlookMailClient };
