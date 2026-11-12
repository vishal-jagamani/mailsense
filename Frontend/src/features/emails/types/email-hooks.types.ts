import {
    AccountAttributes,
    ComposeEmailRequestBody,
    EmailAttributes,
    Filter,
    FilterOption,
    GetThreadResponse,
    PaginatedDataResponse,
    UpdateAPIResponse,
    UploadAttachmentResponse,
} from '@mailsense/types';
import React, { Dispatch, SetStateAction } from 'react';

export interface UseEmailActionsOptions {
    readonly selectedEmails: readonly string[];
    readonly emailsData: PaginatedDataResponse<EmailAttributes> | null;
    readonly setEmailsData: Dispatch<SetStateAction<PaginatedDataResponse<EmailAttributes> | null>>;
    readonly onRefresh: () => void;
    readonly onClearSelection?: () => void;
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

export interface UseComposeEmailDraftActions {
    activeDraftId?: string;
    isOpen: boolean;
    closeCompose: () => void;
    composeEmailBody: ComposeEmailRequestBody;
    setComposeEmailBody: React.Dispatch<React.SetStateAction<ComposeEmailRequestBody>>;
    setStagedAttachments: React.Dispatch<React.SetStateAction<UploadAttachmentResponse['attachment'][]>>;
    setToEmailSearchText: React.Dispatch<React.SetStateAction<string>>;
}

export interface UseComposeEmailActionsParams {
    accounts: AccountAttributes[] | undefined;
    stagedAttachments: UploadAttachmentResponse['attachment'][];
    draftId: string | undefined;
    activeDraftId: string | undefined;
    composeEmailBody: ComposeEmailRequestBody;
    handleClose: () => void;
    setComposeEmailBody: React.Dispatch<React.SetStateAction<ComposeEmailRequestBody>>;
}

export interface UseComposeEmailAttachmentsParams {
    composeEmailBody: ComposeEmailRequestBody;
    setComposeEmailBody: React.Dispatch<React.SetStateAction<ComposeEmailRequestBody>>;
    accounts: AccountAttributes[] | undefined;
    setStagedAttachments: React.Dispatch<React.SetStateAction<UploadAttachmentResponse['attachment'][]>>;
    setIsUploadingAttachment: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface UseEvaluateKeyPressParams {
    event: KeyboardEvent;
    emails: EmailAttributes[];
    selectedIndex: number;
    selectedEmails: string[];
    currentEmail: EmailAttributes;
    onSelectIndex: (index: number) => void;
    onOpenEmail: (email: EmailAttributes) => void;
    onStarEmail?: (email?: EmailAttributes) => void;
    onMarkUnread?: (email?: EmailAttributes) => void;
    onArchiveEmail?: (email?: EmailAttributes) => void;
    onDeleteEmail?: (email?: EmailAttributes) => void;
    onOpenCompose?: () => void;
    onOpenShortcutsModal?: () => void;
}

export interface UseEmailKeyboardShortcutsParams {
    emails: EmailAttributes[];
    selectedIndex: number;
    selectedEmails?: string[];
    onSelectIndex: (index: number) => void;
    onOpenEmail: (email: EmailAttributes) => void;
    onStarEmail?: (email?: EmailAttributes) => void;
    onMarkUnread?: (email?: EmailAttributes) => void;
    onArchiveEmail?: (email?: EmailAttributes) => void;
    onDeleteEmail?: (email?: EmailAttributes) => void;
    onOpenCompose?: () => void;
    onOpenShortcutsModal?: () => void;
    enabled?: boolean;
}
