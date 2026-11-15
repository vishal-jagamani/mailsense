import { OutlookAttachmentClient } from './outlook-attachment.client.js';
import { OutlookAuthClient } from './outlook-auth.client.js';
import { OutlookFolderClient } from './outlook-folder.client.js';
import { OutlookMailReadClient } from './outlook-mail-read.client.js';
import { OutlookMailWriteClient } from './outlook-mail-write.client.js';

export class OutlookClient {
    // Outlook auth client
    public static readonly getAccessTokenFromCode = OutlookAuthClient.getAccessTokenFromCode;
    public static readonly fetchAccessToken = OutlookAuthClient.fetchAccessToken;
    public static readonly refreshAccessToken = OutlookAuthClient.refreshAccessToken;
    public static readonly getUserProfileFromAccessToken = OutlookAuthClient.getUserProfileFromAccessToken;

    // Outlook mail read client
    public static readonly getMessages = OutlookMailReadClient.getMessages;
    public static readonly getMessagesFromDeltaLink = OutlookMailReadClient.getMessagesFromDeltaLink;
    public static readonly getMessageDetails = OutlookMailReadClient.getMessageDetails;
    public static readonly searchContacts = OutlookMailReadClient.searchContacts;

    // Outlook mail write client
    public static readonly createDraftMessage = OutlookMailWriteClient.createDraftMessage;
    public static readonly sendDraftMessage = OutlookMailWriteClient.sendDraftMessage;
    public static readonly sendMailDirect = OutlookMailWriteClient.sendMailDirect;
    public static readonly flagEmail = OutlookMailWriteClient.flagEmail;
    public static readonly unreadEmail = OutlookMailWriteClient.unreadEmail;
    public static readonly deleteEmail = OutlookMailWriteClient.deleteEmail;
    public static readonly deleteEmailPermanently = OutlookMailWriteClient.deleteEmailPermanently;
    public static readonly archiveEmail = OutlookMailWriteClient.archiveEmail;
    public static readonly unarchiveEmail = OutlookMailWriteClient.unarchiveEmail;
    public static readonly moveMessage = OutlookMailWriteClient.moveMessage;
    public static readonly createUploadSession = OutlookMailWriteClient.createUploadSession;
    public static readonly uploadChunk = OutlookMailWriteClient.uploadChunk;

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

export { OutlookAttachmentClient, OutlookAuthClient, OutlookFolderClient, OutlookMailReadClient, OutlookMailWriteClient };
