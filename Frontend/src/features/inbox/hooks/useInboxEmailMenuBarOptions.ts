import { Archive, MailCheck, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useArchiveEmailMutation, useStarEmailMutation, useUnreadEmailMutation } from '@features/emails/api/email.mutations';
import { useDeleteEmail } from '../api/inbox.queries';
import { EmailMenuBarOptionItem, InboxEmailMenuBarOptionsParams, InboxEmailMenuBarOptionsReturn } from '../types/inbox.types';

export const useInboxEmailMenuBarOptions = ({
    emailIds,
    allEmails,
    onRefetchEmails,
    onResetPage,
    onResetSelection,
}: InboxEmailMenuBarOptionsParams): InboxEmailMenuBarOptionsReturn => {
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

    const { mutate: starEmailMutate, isPending: starEmailLoading } = useStarEmailMutation();
    const { mutate: unreadEmailMutate, isPending: unreadEmailLoading } = useUnreadEmailMutation();
    const { mutate: archiveEmailMutate, isPending: archiveEmailLoading } = useArchiveEmailMutation();
    const { mutate: deleteEmailMutate, isPending: deleteEmailLoading } = useDeleteEmail();

    const handleActionSuccess = (message: string): void => {
        toast.success(message, { duration: 3000 });
        onResetSelection();
        onResetPage();
        onRefetchEmails();
    };

    const handleStar = (): void => {
        if (emailIds.length === 0) return;
        const targetIds = [...emailIds];
        const targetEmails = allEmails ? allEmails.filter((item) => targetIds.includes(item._id)) : [];
        const allStarred = targetEmails.length > 0 && targetEmails.every((item) => item.folders?.some((f) => f.toUpperCase() === 'STARRED'));
        const nextStar = !allStarred;

        starEmailMutate(
            { emailIds: targetIds, star: nextStar },
            {
                onSuccess: (res) => {
                    if (res && (!('status' in res) || res.status)) {
                        handleActionSuccess(
                            targetIds.length > 1
                                ? nextStar
                                    ? `${targetIds.length} emails starred`
                                    : `${targetIds.length} emails unstarred`
                                : nextStar
                                  ? 'Email starred'
                                  : 'Email unstarred',
                        );
                    } else {
                        toast.error('Failed to update star status. Please retry in some time.', { duration: 4000 });
                        onRefetchEmails();
                    }
                },
                onError: () => onRefetchEmails(),
            },
        );
    };

    const handleToggleUnread = (): void => {
        if (emailIds.length === 0) return;
        const targetIds = [...emailIds];
        const targetEmails = allEmails ? allEmails.filter((item) => targetIds.includes(item._id)) : [];
        const allUnread = targetEmails.length > 0 && targetEmails.every((item) => !item.isRead);
        const nextUnread = !allUnread;

        unreadEmailMutate(
            { emailIds: targetIds, unread: nextUnread },
            {
                onSuccess: (res) => {
                    if (res && res.status) {
                        handleActionSuccess(
                            targetIds.length > 1
                                ? nextUnread
                                    ? `${targetIds.length} emails marked as unread`
                                    : `${targetIds.length} emails marked as read`
                                : nextUnread
                                  ? 'Marked as unread'
                                  : 'Marked as read',
                        );
                    } else {
                        toast.error('Failed to update read status. Please retry in some time.', { duration: 4000 });
                        onRefetchEmails();
                    }
                },
                onError: () => onRefetchEmails(),
            },
        );
    };

    const handleArchive = (): void => {
        if (emailIds.length === 0) return;
        const targetIds = [...emailIds];

        archiveEmailMutate(
            { emailIds: targetIds, archive: true },
            {
                onSuccess: (res) => {
                    if (res && res.status) {
                        handleActionSuccess(
                            targetIds.length > 1 ? `${targetIds.length} emails archived successfully` : 'Email archived successfully',
                        );
                    } else {
                        toast.error('Failed to archive email. Please retry in some time.', { duration: 4000 });
                        onRefetchEmails();
                    }
                },
                onError: () => onRefetchEmails(),
            },
        );
    };

    const handleConfirmDelete = (): void => {
        if (emailIds.length === 0) return;
        const targetIds = [...emailIds];
        setShowDeleteModal(false);

        deleteEmailMutate(
            { emailIds: targetIds, trash: true },
            {
                onSuccess: (res) => {
                    if (res && res.status) {
                        handleActionSuccess(targetIds.length > 1 ? `${targetIds.length} emails deleted successfully` : 'Email deleted successfully');
                    } else {
                        toast.error('Failed to delete email. Please retry in some time.', { duration: 4000 });
                        onRefetchEmails();
                    }
                },
                onError: () => onRefetchEmails(),
            },
        );
    };

    const options: readonly EmailMenuBarOptionItem[] = [
        { id: 1, label: 'Star', icon: Star, iconColor: 'text-yellow-500', action: handleStar },
        { id: 2, label: 'Mark as Unread', icon: MailCheck, iconColor: 'text-blue-500', action: handleToggleUnread },
        { id: 3, label: 'Archive', icon: Archive, iconColor: 'text-emerald-500', action: handleArchive },
        { id: 4, label: 'Delete', icon: Trash2, iconColor: 'text-red-500', action: () => setShowDeleteModal(true) },
    ];

    return {
        states: { showDeleteModal },
        setters: { setShowDeleteModal },
        actionOptions: options,
        actions: { handleConfirmDelete },
        starEmail: { isLoading: starEmailLoading },
        unreadEmail: { isLoading: unreadEmailLoading },
        archiveEmail: { isLoading: archiveEmailLoading },
        deleteEmail: { isLoading: deleteEmailLoading },
    };
};
