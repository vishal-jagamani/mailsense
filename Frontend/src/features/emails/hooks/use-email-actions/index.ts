'use client';

import { UseEmailActionsOptions } from '@features/emails/types';
import { useEmailStarArchiveActions } from './useEmailStarArchiveActions';
import { useEmailUnreadDeleteActions } from './useEmailUnreadDeleteActions';

export function useEmailActions(options: UseEmailActionsOptions) {
    const {
        starEmail: { handleStar },
        archiveEmail: { handleArchive },
    } = useEmailStarArchiveActions(options);

    const {
        states: { emailsToDelete, isShortcutsModalOpen },
        setters: { setEmailsToDelete, setIsShortcutsModalOpen },
        unreadEmail: { handleUnread },
        deleteEmail: { handlePromptDelete, handleConfirmDelete, loading: isDeleting },
    } = useEmailUnreadDeleteActions(options);

    return {
        states: { emailsToDelete, isShortcutsModalOpen },
        setters: { setEmailsToDelete, setIsShortcutsModalOpen },
        starEmail: handleStar,
        archiveEmail: handleArchive,
        unreadEmail: handleUnread,
        deleteEmail: { handlePromptDelete, handleConfirmDelete, loading: isDeleting },
    };
}
