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
export enum GMAIL_LABELS {
    INBOX = 'INBOX',
    SENT = 'SENT',
    SPAM = 'SPAM',
    TRASH = 'TRASH',
    UNREAD = 'UNREAD',
    STARRED = 'STARRED',
    IMPORTANT = 'IMPORTANT',
}
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
    emailObject: EmailInput;
    historyId: string;
    receivedAt: Date;
}

// Gmail Labels Types & Interfaces
export enum GmailLabelMessageListVisibility {
    SHOW = 'show',
    HIDE = 'hide',
}

export enum GmailLabelLabelListVisibility {
    LABEL_SHOW = 'labelShow',
    LABEL_SHOW_IF_UNREAD = 'labelShowIfUnread',
    LABEL_HIDE = 'labelHide',
}

export enum GmailLabelType {
    SYSTEM = 'system',
    USER = 'user',
}

export interface GmailLabel {
    id: string;
    name: string;
    messageListVisibility: GmailLabelMessageListVisibility;
    labelListVisibility: GmailLabelLabelListVisibility;
    type: GmailLabelType;
    messagesTotal: number;
    messagesUnread: number;
    threadsTotal: number;
    threadsUnread: number;
    color: {
        textColor: string;
        backgroundColor: string;
    };
}

export interface GmailLabelsListResponse {
    labels: GmailLabel[];
}

// Other contacts types
interface GooglePersonMetadata {
    primary?: boolean;
    sourcePrimary?: boolean;
    source: {
        type: string;
        id: string;
    };
}

interface GooglePersonEmail {
    metadata: GooglePersonMetadata;
    value: string;
}

interface GooglePersonName {
    metadata: GooglePersonMetadata;
    displayName: string;
    familyName?: string;
    givenName?: string;
}

export interface GooglePerson {
    resourceName: string;
    etag: string;
    emailAddresses?: GooglePersonEmail[];
    names?: GooglePersonName[]; // Note: frequently missing in Other Contacts
}

/**
 * Matches your actual response: root property is "results"
 */
export interface GoogleOtherContactsSearchResponse {
    results?: {
        person: GooglePerson;
    }[];
}
