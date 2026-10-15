import { AccountAttributes, CreateFolderBodyParams, EmailAttributes, Filter, FolderAttributes } from '@mailsense/types';

export interface RenameFolderState {
    readonly renameFolderFlag: boolean;
    readonly renameFolderId: string;
    readonly renameFolderValue: string;
    readonly setRenameFolderFlag: (value: boolean) => void;
    readonly setRenameFolderId: (id: string) => void;
    readonly setRenameFolderValue: (value: string) => void;
    readonly handleUpdateFolder: (id: string, body: CreateFolderBodyParams) => void;
}

export interface FolderCardProps {
    readonly data: FolderAttributes;
    readonly renameState: RenameFolderState;
    readonly deleteFolder: (id: string) => void;
}

export interface FolderEmailListHeaderProps {
    readonly searchValue: string;
    readonly setSearchValue: (value: string) => void;
    readonly accounts: readonly AccountAttributes[];
    readonly filter: Filter | null;
    readonly setFilter: (value: Filter) => void;
    readonly selectedEmails: readonly string[];
    readonly allEmails?: readonly EmailAttributes[];
    readonly handleResetSelection: () => void;
    readonly handleResetPage: () => void;
    readonly fetchEmailsData: () => void;
    readonly onOpenShortcutsModal?: () => void;
}
