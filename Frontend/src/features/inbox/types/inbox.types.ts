import { EmailAttributes } from '@mailsense/types';
import { LucideIcon } from 'lucide-react';

export interface UseInboxEmailStarArchiveActionsParams {
    readonly emailIds: readonly string[];
    readonly allEmails?: readonly EmailAttributes[];
    readonly handleActionSuccess: (message: string) => void;
    readonly onRefetchEmails: () => void;
}

export interface UseInboxEmailUnreadDeleteActions {
    readonly emailIds: readonly string[];
    readonly allEmails?: readonly EmailAttributes[];
    readonly handleActionSuccess: (message: string) => void;
    readonly onRefetchEmails: () => void;
    readonly setShowDeleteModal: (showDeleteModal: boolean) => void;
}

export interface UseEmailStarArchiveActionsReturn {
    readonly starAction: {
        handleStar: () => void;
        starEmailLoading: boolean;
    };
    readonly archiveAction: {
        handleArchive: () => void;
        archiveEmailLoading: boolean;
    };
}

export interface UseInboxEmailUnreadDeleteActionsReturn {
    readonly unreadAction: {
        handleUnread: () => void;
        unreadEmailLoading: boolean;
    };
    readonly deleteAction: {
        handleDelete: () => void;
        deleteEmailLoading: boolean;
    };
}

export interface InboxEmailMenuBarOptionsParams {
    readonly emailIds: readonly string[];
    readonly allEmails?: readonly EmailAttributes[];
    readonly onRefetchEmails: () => void;
    readonly onResetSelection: () => void;
    readonly onResetPage: () => void;
}

export interface EmailMenuBarOptionItem {
    readonly id: number;
    readonly label: string;
    readonly icon: LucideIcon;
    readonly iconColor: string;
    readonly action: () => void;
}

export interface InboxEmailMenuBarOptionsReturn {
    readonly states: {
        readonly showDeleteModal: boolean;
    };
    readonly setters: {
        readonly setShowDeleteModal: (show: boolean) => void;
    };
    readonly actionOptions: readonly EmailMenuBarOptionItem[];
    readonly actions: {
        readonly handleConfirmDelete: () => void;
    };
    readonly starEmail: {
        readonly isLoading: boolean;
    };
    readonly unreadEmail: {
        readonly isLoading: boolean;
    };
    readonly archiveEmail: {
        readonly isLoading: boolean;
    };
    readonly deleteEmail: {
        readonly isLoading: boolean;
    };
}

export interface InboxEmailMenuBarOptionsProps {
    readonly emailIds: string[];
    readonly allEmails?: EmailAttributes[];
    readonly onRefetchEmails: () => void;
    readonly onResetSelection: () => void;
    readonly onResetPage: () => void;
}
