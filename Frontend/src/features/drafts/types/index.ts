import { ComposeEmailRequestBody, DraftListDTO } from '@mailsense/types';

// Component Props Types
export interface DraftListHeaderProps {
    searchValue: string;
    setSearchValue: (value: string) => void;
    selectedDrafts: string[];
    totalDrafts: number;
    handleBulkDelete: () => Promise<void>;
    handleResetPage: () => void;
}

export interface DraftListTableProps {
    data: DraftListDTO[];
    selectedDrafts: string[];
    onDraftSelect: (draftIds: string[]) => void;
    onDeleteDraft: (draftId: string) => Promise<void>;
    onOpenDraft: (draftId: string) => void;
}

export interface DraftListTableHeaderProps {
    allSelected: boolean;
    handleSelectAll: () => void;
}

export interface DraftListTableBodyProps {
    data: DraftListDTO[];
    selectedDrafts: string[];
    handleCheckboxChange: (draftId: string, checked: boolean) => void;
    onOpenDraft: (draftId: string) => void;
    onDeleteDraft: (draftId: string) => Promise<void>;
}

// Hooks Types
export interface UseAutoSaveDraftParams {
    composeBody: ComposeEmailRequestBody;
    isOpen: boolean;
    activeDraftId?: string;
    onDraftSaved?: (draftId: string) => void;
}

export interface UseDraftsPageResult {
    drafts: { data: DraftListDTO[]; total: number; isLoading: boolean; isError: boolean; refetch: () => void };
    actions: {
        handleDraftSelect: (draftIds: string[]) => void;
        handlePageSizeChange: (newPageSize: number) => void;
        handleResetSelection: () => void;
        handleDeleteDraft: (draftId: string) => Promise<void>;
        handleBulkDelete: () => Promise<void>;
        handleOpenDraft: (draftId: string) => void;
    };
    states: { selectedDrafts: string[]; page: number; pageSize: number; searchValue: string; isDeleting: boolean };
    setters: { setPage: (page: number) => void; setSearchValue: (val: string) => void };
}
