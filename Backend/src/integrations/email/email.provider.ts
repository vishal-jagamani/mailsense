import { SearchOtherContactsResponse, UpdateAPIResponse } from '@mailsense/types';
import { EmailDocument, EmailInput } from '@modules/emails/email.model.js';
import { ComposeEmailBody } from '@modules/emails/email.schema.js';
import { FolderInput } from '@modules/folders/folder.model.js';
import { IEmailTAuthToken, IEmailTSendEmailResult, IEmailTUserProfile } from './email.provider.types.js';

export interface SyncResult {
    addedEmails: EmailInput[] | Partial<EmailInput>[];
    deletedEmailIds: string[];
    newCursor: string;
}

export interface IEmailProvider<TAuthToken = IEmailTAuthToken, TUserProfile = IEmailTUserProfile, TSendMailResult = IEmailTSendEmailResult> {
    // Auth & Profile
    getAccessTokenFromCode(code: string): Promise<TAuthToken>;
    getUserProfileFromAccessToken(accessToken: string): Promise<TUserProfile>;
    refreshAccessToken(accountId: string): Promise<string>;

    // Core Ingestion & Sync
    fetchMessages(accountId: string, cursor?: string): Promise<SyncResult | null>;

    // Email Operations
    getMessageDetails(accountId: string, emailId: string, dbEmail?: EmailDocument): Promise<EmailInput>;
    deleteEmails(emailIds: string[], accountId: string, trash?: boolean): Promise<void>;
    archiveEmails(emailIds: string[], accountId: string, archive: boolean): Promise<void>;
    unreadEmails(emailIds: string[], accountId: string, unread: boolean): Promise<void>;
    starEmails(emails: { id: string; providerMessageId: string }[], accountId: string, star: boolean): Promise<void>;
    sendMail(composeEmailData: ComposeEmailBody): Promise<TSendMailResult>;
    searchContacts(accountId: string, searchText: string): Promise<SearchOtherContactsResponse[]>;

    // Attachment Operations
    getAttachment(accountId: string, messageId: string, attachmentId: string): Promise<{ data: Buffer; mimeType: string; filename: string }>;

    // Folder/Label Operations
    getAllFolders(accountId: string, userId: string): Promise<Partial<FolderInput>[]>;
    createFolder(userId: string, accountId: string, folderName: string): Promise<UpdateAPIResponse>;
    updateFolder(accountId: string, folderId: string, folderName: string): Promise<UpdateAPIResponse>;
    deleteFolder(accountId: string, folderId: string): Promise<UpdateAPIResponse>;

    // Folder & Label Relocation Operations
    moveEmails(emailIds: string[], accountId: string, targetFolderIds: string[], removeFolderIds?: string[]): Promise<void>;
}
