import { ProjectionType, SortOrder } from 'mongoose';

import { DATE_RANGE } from '@types';

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

// DB Model Types
export interface FolderAttributes {
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
}

export interface FolderListDBFieldMapping {
    LIST: { projection: ProjectionType<FolderAttributes> };
    SORT: { sort: Record<string, SortOrder> };
}

export interface GetAllFoldersFilters {
    searchText?: string | undefined;
    accountId?: string[] | undefined;
    dateRange?: DATE_RANGE | undefined;
}
