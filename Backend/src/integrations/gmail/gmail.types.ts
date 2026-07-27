import { EmailInput } from '@modules/emails/email.model.js';

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
