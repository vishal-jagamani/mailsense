import { EmailAttributes, Filter, FilterOption } from '@mailsense/types';

export interface EmailListHeaderProps {
    searchValue: string;
    setSearchValue: (value: string) => void;
    filter: Filter | null;
    setFilter: (value: Filter) => void;
    selectedEmails: string[];
    allEmails?: EmailAttributes[];
    handleResetSelection: () => void;
    handleResetPage: () => void;
    emailFilterOptions: FilterOption[];
    fetchEmailsData: () => void;
    onOpenShortcutsModal?: () => void;
}

export interface EmailListTableProps {
    data: EmailAttributes[];
    page: number;
    selectedEmails?: string[];
    focusedIndex?: number;
    onEmailSelect?: (emailIds: string[]) => void;
    onDeleteSuccess?: () => void;
    onDeleteRequest?: (email: EmailAttributes) => void;
}
