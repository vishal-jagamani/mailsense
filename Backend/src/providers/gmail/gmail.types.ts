import { EmailInput } from '@modules/emails/email.model.js';

// User profile interface
export interface GmailUserProfile {
    sub: string;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    email: string;
    email_verified: boolean;
    locale: string;
}

// Messages interfaces
export interface GmailMessages {
    messages: { id: string; threadId: string }[];
    nextPageToken: string;
    resultSizeEstimate: number;
}

type GmailMessageHeaderFull = {
    name: string;
    value: string;
};

type GmailMessagePartsFull = {
    partId: string;
    mimeType: string;
    filename: string;
    headers: GmailMessageHeaderFull[];
    body: { size: number; data: string };
};

export interface GmailMessageObjectFull {
    id: string;
    threadId: string;
    labelIds: string[];
    snippet: string;
    payload: {
        partId: string;
        mimeType: string;
        filename: string;
        headers: GmailMessageHeaderFull[];
        body: { size: number; data?: string };
        parts: GmailMessagePartsFull[];
    };
    sizeEstimate: number;
    historyId: string;
    internalDate: string;
}

export interface GetGmailMessagesResponse {
    emails: EmailInput[];
    lastSyncCursor: string;
}

export interface GmailMessage {
    id: string;
    threadId: string;
}

export interface MessageAdded {
    message: GmailMessage;
}
export interface MessageDeleted {
    message?: GmailMessage;
    messageId?: string;
    id?: string;
}

export interface GmailHistoryRecord {
    id: string;
    messages?: GmailMessageObjectFull[];
    messagesAdded?: MessageAdded[];
    messagesDeleted?: MessageDeleted[];
    labelsAdded?: string[];
    labelsRemoved?: string[];
}
export interface GmailHistoryResponse {
    history: GmailHistoryRecord[];
    nextPageToken?: string;
    historyId: string;
}

export interface ExtractMessageChangesResponse {
    addedMessageIds: string[];
    deletedMessageIds: string[];
}

export interface MessagesAfterLastHistoryResponse {
    addedMessages: EmailInput[];
    deletedMessages: string[];
    newHistoryId: string;
}

export interface GmailParsedEmailResult {
    emailObject: EmailInput,
    historyId: string,
    receivedAt: Date
}