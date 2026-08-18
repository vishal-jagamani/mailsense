import { OutlookMessageObjectFull } from '@mailsense/types';
import { EmailInput } from '@modules/emails/email.model.js';

// API Responses
export interface GetOutlookMessagesResponse {
    emails: Partial<EmailInput>[];
    deltaLink: string;
}

export interface GetOutlookDeltaMessagesResponse {
    addedEmails: Partial<EmailInput>[];
    deletedEmailIds: string[];
    newDeltaLink: string;
}

export interface GetDeltaMessageChangesResponse {
    '@odata.context': string;
    '@odata.deltaLink': string;
    value: OutlookMessageObjectFull[];
}

export interface ExtractDeltaMessageChangesResponse {
    addedEmails: OutlookMessageObjectFull[];
    deletedEmailIds: string[];
}

// Outlook Folders Types & Interfaces
export interface OutlookFolderObject {
    id: string;
    displayName: string;
    parentFolderId: string;
    childFolderCount: number;
    unreadItemCount: number;
    totalItemCount: number;
    isHidden: boolean;
}

export interface OutlookFoldersResponse {
    '@odata.context': string;
    value: OutlookFolderObject[];
}

/**
 * Individual email address object in Outlook
 */
interface OutlookEmailAddress {
    address: string;
    relevanceScore?: number;
}

/**
 * The Person resource returned by the /me/people endpoint
 */
export interface OutlookPerson {
    id: string;
    displayName: string;
    givenName?: string;
    surname?: string;
    birthday?: string;
    personNotes?: string;
    isFavorite?: boolean;
    jobTitle?: string;
    companyName?: string;
    userPrincipalName?: string;
    scoredEmailAddresses: OutlookEmailAddress[];
    personType: {
        class: string;
        subclass: string;
    };
}

/**
 * Standard Microsoft Graph Collection Response
 */
export interface OutlookPeopleSearchResponse {
    value: OutlookPerson[];
    '@odata.context': string;
    '@odata.nextLink'?: string;
}

// Outlook Attachment & Upload Session Types
export interface OutlookFileAttachmentPayload {
    '@odata.type': '#microsoft.graph.fileAttachment';
    name: string;
    contentType: string;
    contentBytes: string;
}

export interface OutlookCreateMessagePayload {
    subject: string;
    body: { contentType: 'Text' | 'HTML'; content: string };
    toRecipients: { emailAddress: { address: string; name: string } }[];
    ccRecipients?: { emailAddress: { address: string; name: string } }[];
    bccRecipients?: { emailAddress: { address: string; name: string } }[];
    attachments?: OutlookFileAttachmentPayload[];
}

export interface OutlookSendMailDirectPayload {
    to: string[];
    subject: string;
    body: string;
    attachments: OutlookFileAttachmentPayload[];
}

export interface OutlookUploadSessionResponse {
    uploadUrl: string;
    expirationDateTime?: string;
    nextExpectedRanges?: string[];
}
