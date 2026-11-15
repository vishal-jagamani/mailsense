import { AccountAttributes, Filter, FolderAttributes } from '@mailsense/types';
import { RenameFolderState } from './folders.types';

// Folder body interfaces
export interface FolderBodyProps {
    tableData: FolderAttributes[];
    size: number;
    page: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}

export interface FolderBodyViewProps extends FolderBodyProps {
    renameState: RenameFolderState;
    deleteFolder: (id: string) => void;
}

export interface FolderCardProps {
    data: FolderAttributes;
    renameState: RenameFolderState;
    deleteFolder: (id: string) => void;
}

export interface FoldersTableProps {
    tableData: FolderAttributes[];
    page: number;
    selectedFolders?: string[];
    onFolderSelect?: (folderIds: string[]) => void;
}

// Folder card interfaces
export interface FolderCardActionsProps {
    data: FolderAttributes;
    renameState: RenameFolderState;
    deleteFolder: (id: string) => void;
}

export interface FolderCardHeaderProps {
    data: FolderAttributes;
    renameState: RenameFolderState;
}

export interface FolderCardInfoProps {
    data: FolderAttributes;
}

export interface FolderHeaderProps {
    filter: Filter | null;
    onFilterChange: (filter: Filter) => void;
    searchText: string;
    setSearchText: (searchText: string) => void;
}

export interface CreateFolderModalProps {
    accounts: AccountAttributes[];
}
