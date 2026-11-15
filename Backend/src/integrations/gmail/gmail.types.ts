import { EmailInput } from '@modules/emails/database/index.js';

export interface GetGmailMessagesResponse {
    emails: EmailInput[];
    lastSyncCursor: string;
}

export interface GmailMessage {
    id: string;
    threadId: string;
}

export interface GmailMessageIdParam {
    id: string;
    providerMessageId: string;
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

export interface GmailRawMessagePayload {
    raw: string;
}

export interface GmailAttachmentDataResponse {
    data: string;
    size: number;
}

export interface GmailAttachmentBufferResult {
    data: Buffer;
    mimeType: string;
    filename: string;
}

export interface GmailMimeMessageAttachment {
    filename: string;
    mimeType: string;
    buffer: Buffer;
}

export interface ParsedMimeHeaders {
    from: string;
    to: string[];
    cc: string[];
    bcc: string[];
    subject: string;
    date: Date;
    messageId: string;
    inReplyTo?: string;
    references?: string[];
}

export interface ExtractedBodyContent {
    bodyHtml: string;
    bodyPlain: string;
    snippet: string;
}

export interface DecodedPartData {
    data: Buffer | null;
    mimeType: string;
    filename?: string;
}
