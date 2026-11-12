import { AccountAttributes, CreateFolderBodyParams, EmailAttributes, Filter } from '@mailsense/types';

export interface UpdateFolderMutationVariables {
    id: string;
    body: CreateFolderBodyParams;
}

export interface RenameFolderState {
    renameFolderFlag: boolean;
    renameFolderId: string;
    renameFolderValue: string;
    setRenameFolderFlag: (value: boolean) => void;
    setRenameFolderId: (id: string) => void;
    setRenameFolderValue: (value: string) => void;
    handleUpdateFolder: (id: string, body: CreateFolderBodyParams) => void;
}

export interface FolderEmailListHeaderProps {
    searchValue: string;
    setSearchValue: (value: string) => void;
    accounts: AccountAttributes[];
    filter: Filter | null;
    setFilter: (value: Filter) => void;
    selectedEmails: string[];
    allEmails?: EmailAttributes[];
    handleResetSelection: () => void;
    handleResetPage: () => void;
    fetchEmailsData: () => void;
    onOpenShortcutsModal?: () => void;
}
