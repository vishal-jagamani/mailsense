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
    // '@removed': {
    //     reason: OutlookMessageRemovedReason;
    // };
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
