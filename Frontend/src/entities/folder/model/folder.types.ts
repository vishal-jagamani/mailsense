import { Filter } from '@shared/types';

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
    filters: Filter;
}
export interface CreateFolderBodyParams {
    accountId: string;
    folderName: string;
}

// Component types
export interface RenameFolderState {
    renameFolderFlag: boolean;
    renameFolderId: string;
    renameFolderValue: string;
    setRenameFolderFlag: (value: boolean) => void;
    setRenameFolderId: (id: string) => void;
    setRenameFolderValue: (value: string) => void;
    handleUpdateFolder: (id: string, body: CreateFolderBodyParams) => void;
}

export interface FolderBodyProps {
    tableData: FolderAttributes[];
    size: number;
    page: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    renameState: RenameFolderState;
    deleteFolder: (id: string) => void;
}
