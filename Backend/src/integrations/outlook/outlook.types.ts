import { EmailInput } from '@modules/emails/email.model.js';

export interface OutlookUserProfile {
    id: string;
    displayName: string;
    givenName: string;
    surname: string;
    mail: string;
}

type OutlookMessageEmailAddress = {
    name: string;
    address: string;
};

export enum OutlookMessageRemovedReason {
    CREATED = 'created',
    DELETED = 'deleted',
    UPDATED = 'updated',
}

export enum OutlookFolders {
    INBOX = 'inbox',
    SENT = 'sentitems',
    ARCHIVE = 'archive',
    DRAFTS = 'drafts',
    DELETED = 'deleteditems',
    SPAM = 'spam',
    OUTBOX = 'outbox',
}

export interface OutlookMessageObjectFull {
    id: string;
    receivedDateTime: string;
    sentDateTime: string;
    hasAttachments: boolean;
    subject: string;
    bodyPreview: string;
    parentFolderId: string;
    conversationId: string;
    conversationIndex: string;
    isRead: boolean;
    isDraft: boolean;
    webLink: string;
    body: {
        contentType: string;
        content: string;
    };
    sender: { emailAddress: OutlookMessageEmailAddress };
    from: { emailAddress: OutlookMessageEmailAddress };
    toRecipients: { emailAddress: OutlookMessageEmailAddress }[];
    ccRecipients: { emailAddress: OutlookMessageEmailAddress }[];
    bccRecipients: { emailAddress: OutlookMessageEmailAddress }[];
}

// API Responses
export interface OutlookMessagesResponse {
    '@odata.context': string;
    value: OutlookMessageObjectFull[];
    '@odata.nextLink': string;
    '@odata.deltaLink': string;
}

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
