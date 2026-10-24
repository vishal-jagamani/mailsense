import {
    AccountAttributes,
    EmailAttachment,
    EmailAttributes,
    Filter,
    FilterOption,
    FolderAttributes,
    GetThreadResponse,
    PaginatedDataResponse,
    UpdateAPIResponse,
} from '@mailsense/types';
import { Dispatch, MouseEvent, SetStateAction } from 'react';

// ==========================================
// Component Props
// ==========================================

export interface DeleteModalProps {
    readonly isOpen: boolean;
    readonly emailCount: number;
    readonly isDeleting: boolean;
    readonly onConfirm: () => void;
    readonly onCancel: () => void;
}

export interface EmailMenuBarOptionsProps {
    readonly selectedEmailIds: readonly string[];
    readonly isAllSelected: boolean;
    readonly onSelectAll: () => void;
    readonly onDeselectAll: () => void;
    readonly onStarSelected: (star: boolean) => void;
    readonly onMarkReadSelected: (isRead: boolean) => void;
    readonly onArchiveSelected: () => void;
    readonly onDeleteSelected: () => void;
    readonly onMoveSelected: (targetFolderId: string) => void;
}

export interface EmailBodyPreviewProps {
    readonly bodyPlain?: string;
    readonly bodyHtml?: string;
    readonly isExpanded?: boolean;
}

export interface AttachmentListProps {
    readonly attachments: readonly EmailAttachment[];
    readonly accountId: string;
    readonly messageId: string;
}

export interface AttachmentPreviewProps {
    readonly attachment: EmailAttachment;
    readonly accountId: string;
    readonly messageId: string;
    readonly onPreviewClick?: (attachment: EmailAttachment) => void;
}

export interface MoveToFolderDropdownProps {
    readonly selectedEmailIds: readonly string[];
    readonly availableFolders: readonly FolderAttributes[];
    readonly onFolderSelect: (folderId: string) => void;
    readonly disabled?: boolean;
}

export interface EmailHeaderProps {
    readonly email: EmailAttributes;
    readonly isStarred: boolean;
    readonly onToggleStar: (e: MouseEvent<HTMLButtonElement>) => void;
    readonly onReplyClick?: () => void;
}

export interface AttachmentBadgeProps {
    readonly attachmentCount: number;
    readonly className?: string;
}

export interface ThreadViewHeaderBarProps {
    readonly subject: string;
    readonly messageCount: number;
    readonly onBack: () => void;
}

export interface ThreadViewProps {
    readonly emailId: string;
    readonly onBack: () => void;
}

export interface ComposeEmailHeaderProps {
    readonly isSending: boolean;
    readonly onMinimize?: () => void;
    readonly onClose: () => void;
}

export interface ComposeEmailFooterProps {
    readonly isSending: boolean;
    readonly canSend: boolean;
    readonly onSend: () => void;
    readonly onDiscard: () => void;
    readonly onAttachClick: () => void;
}

export interface SearchToEmailPopupProps {
    readonly isOpen: boolean;
    readonly searchQuery: string;
    readonly onSelectEmail: (email: string) => void;
    readonly onClose: () => void;
}

// ==========================================
// Shared Hook Parameter & Return Contracts
// ==========================================

export interface UseEmailActionsOptions {
    readonly selectedEmails: readonly string[];
    readonly emailsData: PaginatedDataResponse<EmailAttributes> | null;
    readonly setEmailsData: Dispatch<SetStateAction<PaginatedDataResponse<EmailAttributes> | null>>;
    readonly onRefresh: () => void;
    readonly onClearSelection?: () => void;
}

export interface UseEmailActionsReturn {
    readonly emailsToDelete: string[];
    readonly isShortcutsModalOpen: boolean;
    readonly isDeleting: boolean;
    readonly setEmailsToDelete: (emails: string[]) => void;
    readonly setIsShortcutsModalOpen: (open: boolean) => void;
    readonly handleToggleStar: (email?: EmailAttributes) => void;
    readonly handleToggleUnread: (email?: EmailAttributes) => void;
    readonly handleArchiveEmail: (email?: EmailAttributes) => void;
    readonly handleConfirmDelete: () => void;
    readonly handlePromptDelete: (email?: EmailAttributes) => void;
}

export interface UseEmailPaginationOptions {
    readonly initialPage?: number;
    readonly initialPageSize?: number;
    readonly initialFilter?: Filter | null;
}

export interface UseEmailPaginationReturn {
    readonly page: number;
    readonly pageSize: number;
    readonly searchValue: string;
    readonly debouncedSearchValue: string;
    readonly filter: Filter | null;
    readonly setPage: (page: number) => void;
    readonly setPageSize: (size: number) => void;
    readonly setSearchValue: (value: string) => void;
    readonly setFilter: (filter: Filter | null) => void;
    readonly handlePageSizeChange: (newSize: number) => void;
    readonly handleResetPage: () => void;
}

export interface UseEmailListStateReturn {
    readonly selectedEmails: string[];
    readonly focusedIndex: number;
    readonly emailsData: PaginatedDataResponse<EmailAttributes> | null;
    readonly setSelectedEmails: Dispatch<SetStateAction<string[]>>;
    readonly setFocusedIndex: (index: number) => void;
    readonly setEmailsData: Dispatch<SetStateAction<PaginatedDataResponse<EmailAttributes> | null>>;
    readonly handleEmailSelect: (emailIds: string[]) => void;
    readonly handleResetSelection: () => void;
}

export interface UseInboxPageReturnParams {
    emails: {
        data: PaginatedDataResponse<EmailAttributes> | null;
        fetchEmailsData: () => void;
        isLoadingEmails: boolean;
        isEmailError: boolean;
    };
    emailFilterOptions: {
        data: FilterOption[] | undefined;
        isLoading: boolean;
    };
    actions: {
        handleResetSelection: () => void;
        handleEmailSelect: (emailIds: string[]) => void;
        handlePageSizeChange: (newSize: number) => void;
        handleResetPage: () => void;
        handleConfirmDelete: () => void;
        handleToggleStar: (email?: EmailAttributes) => void;
        handleToggleUnread: (email?: EmailAttributes) => void;
        handleArchiveEmail: (email?: EmailAttributes) => void;
        handlePromptDelete: (email?: EmailAttributes) => void;
    };
    states: {
        selectedEmails: string[];
        pageSize: number;
        searchValue: string;
        filter: Filter | null;
        page: number;
        isSyncingInProgress: boolean;
        focusedIndex: number;
        isShortcutsModalOpen: boolean;
        emailsToDelete: string[];
    };
    setters: {
        setSearchValue: (value: string) => void;
        setFilter: (value: Filter | null) => void;
        setPage: (value: number) => void;
        setFocusedIndex: (index: number) => void;
        setIsShortcutsModalOpen: (open: boolean) => void;
        setEmailsToDelete: (emails: string[]) => void;
    };
}

export interface EmailsPageAccountState {
    readonly data: AccountAttributes | undefined;
    readonly isLoadingAccount: boolean;
}

export interface EmailsPageEmailState {
    readonly data: EmailAttributes | undefined;
    readonly isLoadingEmail: boolean;
}

export interface EmailsPageThreadState {
    readonly data: GetThreadResponse | undefined;
    readonly isLoadingThread: boolean;
}

export interface EmailsPageUnreadOperationState {
    readonly trigger: (emailIds: string[], unread: boolean) => void;
    readonly unreadEmailLoading: boolean;
    readonly unreadEmailSuccess: UpdateAPIResponse | undefined;
}

export interface EmailsPageSetterState {
    readonly setIsManualUnreadOperation: (value: boolean) => void;
}

export interface UseEmailsPageReturnParams {
    readonly account: EmailsPageAccountState;
    readonly email: EmailsPageEmailState;
    readonly thread: EmailsPageThreadState;
    readonly unreadEmail: EmailsPageUnreadOperationState;
    readonly setter: EmailsPageSetterState;
}
