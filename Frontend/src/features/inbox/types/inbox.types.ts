import { EmailAttributes } from '@mailsense/types';
import { LucideIcon } from 'lucide-react';

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

export interface EmailMenuBarOptionsProps {
    readonly emailIds: string[];
    readonly allEmails?: EmailAttributes[];
    readonly onRefetchEmails: () => void;
    readonly onResetSelection: () => void;
    readonly onResetPage: () => void;
}
