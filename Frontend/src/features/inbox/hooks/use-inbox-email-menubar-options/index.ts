import { Archive, MailCheck, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { EmailMenuBarOptionItem, InboxEmailMenuBarOptionsParams, InboxEmailMenuBarOptionsReturn } from '@features/inbox/types/inbox.types';
import { useInboxEmailStarArchiveActions } from './useInboxEmailStarArchiveActions';
import { useInboxEmailUnreadDeleteActions } from './useInboxEmailUnreadDeleteActions';

export const useInboxEmailMenuBarOptions = ({
    emailIds,
    allEmails,
    onRefetchEmails,
    onResetPage,
    onResetSelection,
}: InboxEmailMenuBarOptionsParams): InboxEmailMenuBarOptionsReturn => {
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

    const handleActionSuccess = (message: string): void => {
        toast.success(message, { duration: 3000 });
        onResetSelection();
        onResetPage();
        onRefetchEmails();
    };

    const {
        starAction: { handleStar, starEmailLoading },
        archiveAction: { handleArchive, archiveEmailLoading },
    } = useInboxEmailStarArchiveActions({
        emailIds,
        allEmails,
        handleActionSuccess,
        onRefetchEmails,
    });

    const {
        unreadAction: { handleUnread, unreadEmailLoading },
        deleteAction: { handleDelete, deleteEmailLoading },
    } = useInboxEmailUnreadDeleteActions({
        emailIds,
        allEmails,
        handleActionSuccess,
        onRefetchEmails,
        setShowDeleteModal,
    });

    const options: readonly EmailMenuBarOptionItem[] = [
        { id: 1, label: 'Star', icon: Star, iconColor: 'text-yellow-500', action: handleStar },
        { id: 2, label: 'Mark as Unread', icon: MailCheck, iconColor: 'text-blue-500', action: handleUnread },
        { id: 3, label: 'Archive', icon: Archive, iconColor: 'text-emerald-500', action: handleArchive },
        { id: 4, label: 'Delete', icon: Trash2, iconColor: 'text-red-500', action: () => setShowDeleteModal(true) },
    ];

    return {
        states: { showDeleteModal },
        setters: { setShowDeleteModal },
        actionOptions: options,
        actions: { handleConfirmDelete: handleDelete },
        starEmail: { isLoading: starEmailLoading },
        unreadEmail: { isLoading: unreadEmailLoading },
        archiveEmail: { isLoading: archiveEmailLoading },
        deleteEmail: { isLoading: deleteEmailLoading },
    };
};
