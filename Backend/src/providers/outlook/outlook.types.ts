export interface OutlookUserProfile {
    id: string;
    displayName: string;
    givenName: string;
    surname: string;
    mail: string;
}

interface OutlookMessageEmailAddress {
    name: string;
    address: string;
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
}
