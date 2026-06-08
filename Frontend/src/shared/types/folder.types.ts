import { DATE_RANGE } from '@entities/email';

export enum FolderKind {
    SYSTEM = 'SYSTEM',
    CUSTOM = 'CUSTOM',
}

export enum FolderRole {
    INBOX = 'INBOX',
    SENT = 'SENT',
    DRAFTS = 'DRAFTS',
    TRASH = 'TRASH',
    SPAM = 'SPAM',
    ARCHIVE = 'ARCHIVE',
    STARRED = 'STARRED',
    IMPORTANT = 'IMPORTANT',
    OTHER = 'OTHER',
}

export interface FolderAttributes {
    _id: string;
    userId: string;
    accountId: string;

    providerFolderId: string;
    parentProviderFolderId: string;

    name: string;
    normalizedName: string;
    role: FolderRole;
    kind: FolderKind;

    totalEmails: number;
    totalUnreadEmails: number;
    totalThreads?: number;
    totalUnreadThreads?: number;

    totalChildFolders: number;
    isHidden: boolean;

    color: {
        text: string;
        background: string;
    };

    lastSyncedAt: Date;
    providerMeta?: Record<string, unknown>;

    createdAt: Date;
    updatedAt: Date;
}

export interface GetAllFoldersRequestOptions {
    userId: string;
    size: number;
    page: number;
    filters: GetAllFoldersFilters;
}

export interface GetAllFoldersFilters {
    searchText?: string | undefined;
    accountId?: string[] | undefined;
    dateRange?: DATE_RANGE | undefined;
}

export interface CreateFolderBodyParams {
    accountId: string;
    folderName: string;
}
