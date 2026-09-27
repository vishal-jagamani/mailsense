import { EmailAttributes, PaginatedDataResponse } from '@mailsense/types';

// Mutation Parameter & Context Interfaces
export interface StarEmailMutationParams {
    emailIds: string[];
    star: boolean;
}

export interface StarEmailMutationContext {
    previousEmails: PaginatedDataResponse<EmailAttributes> | undefined;
}

export interface UnreadEmailMutationParams {
    emailIds: string[];
    unread: boolean;
}

export interface UnreadEmailMutationContext {
    previousEmails: PaginatedDataResponse<EmailAttributes> | undefined;
}

export interface ArchiveEmailMutationParams {
    emailIds: string[];
    archive: boolean;
}

export interface ArchiveEmailMutationContext {
    previousEmails: PaginatedDataResponse<EmailAttributes> | undefined;
}

export interface MoveEmailsMutationContext {
    previousEmails: PaginatedDataResponse<EmailAttributes> | undefined;
}

// Hook Parameter Interfaces
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

// Component Props Interfaces
export interface KeyboardShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}
