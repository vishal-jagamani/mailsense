import { Archive, MailCheck, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useArchiveEmailMutation, useStarEmailMutation, useUnreadEmailMutation } from '@features/emails/api/email.mutations';
import { EmailAttributes } from '@mailsense/types';
import { useDeleteEmail } from '../api/inbox.queries';

interface InboxEmailMenuBarOptionsParams {
    emailIds: string[];
    allEmails?: EmailAttributes[];
    onRefetchEmails: () => void;
    onResetSelection: () => void;
    onResetPage: () => void;
}

export const useInboxEmailMenuBarOptions = ({
    emailIds,
    allEmails,
    onRefetchEmails,
    onResetPage,
    onResetSelection,
}: InboxEmailMenuBarOptionsParams) => {
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

    const { mutate: starEmailMutate, isPending: starEmailLoading } = useStarEmailMutation();
    const { mutate: unreadEmailMutate, isPending: unreadEmailLoading } = useUnreadEmailMutation();
    const { mutate: archiveEmailMutate, isPending: archiveEmailLoading } = useArchiveEmailMutation();
    const { mutate: deleteEmailMutate, isPending: deleteEmailLoading } = useDeleteEmail();

    const handleStar = (): void => {
        if (emailIds.length === 0) return;
        const targetIds = [...emailIds];

        let nextStar = true;
        if (allEmails && allEmails.length > 0) {
            const targetEmails = allEmails.filter((item) => targetIds.includes(item._id));
            const allStarred =
                targetEmails.length > 0 &&
                targetEmails.every((item) => item.folders?.some((f) => f.toUpperCase() === 'STARRED' || f.toLowerCase() === 'starred'));
            nextStar = !allStarred;
        }

        starEmailMutate(
            { emailIds: targetIds, star: nextStar },
            {
                onSuccess: (res) => {
                    if (res && (!('status' in res) || res.status)) {
                        const label =
                            targetIds.length > 1
                                ? nextStar
                                    ? `${targetIds.length} emails starred`
                                    : `${targetIds.length} emails unstarred`
                                : nextStar
                                  ? 'Email starred'
                                  : 'Email unstarred';
                        toast.success(label, { duration: 3000 });
                        onResetSelection();
                        onResetPage();
                        onRefetchEmails();
                    } else {
                        toast.error('Failed to update star status. Please retry in some time.', { duration: 4000 });
                        onRefetchEmails();
                    }
                },
                onError: (error: Error) => {
                    console.error('Error updating star status:', error);
                    onRefetchEmails();
                },
            },
        );
    };

    const handleToggleUnread = (): void => {
        if (emailIds.length === 0) return;
        const targetIds = [...emailIds];

        let nextUnread = true;
        if (allEmails && allEmails.length > 0) {
            const targetEmails = allEmails.filter((item) => targetIds.includes(item._id));
            const allUnread = targetEmails.length > 0 && targetEmails.every((item) => !item.isRead);
            nextUnread = !allUnread;
        }

        unreadEmailMutate(
            { emailIds: targetIds, unread: nextUnread },
            {
                onSuccess: (res) => {
                    if (res && res.status) {
                        const label =
                            targetIds.length > 1
                                ? nextUnread
                                    ? `${targetIds.length} emails marked as unread`
                                    : `${targetIds.length} emails marked as read`
                                : nextUnread
                                  ? 'Marked as unread'
                                  : 'Marked as read';
                        toast.success(label, { duration: 3000 });
                        onResetSelection();
                        onResetPage();
                        onRefetchEmails();
                    } else {
                        toast.error('Failed to update read status. Please retry in some time.', { duration: 4000 });
                        onRefetchEmails();
                    }
                },
                onError: (error: Error) => {
                    console.error('Error updating read status:', error);
                    onRefetchEmails();
                },
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
                        const label =
                            targetIds.length > 1 ? `${targetIds.length} emails archived successfully` : 'Email archived successfully';
                        toast.success(label, { duration: 3000 });
                        onResetSelection();
                        onResetPage();
                        onRefetchEmails();
                    } else {
                        toast.error('Failed to archive email. Please retry in some time.', { duration: 4000 });
                        onRefetchEmails();
                    }
                },
                onError: (error: Error) => {
                    console.error('Error archiving email:', error);
                    onRefetchEmails();
                },
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
                        toast.success(
                            targetIds.length > 1 ? `${targetIds.length} emails deleted successfully` : 'Email deleted successfully',
                            { duration: 3000 },
                        );
                        onResetSelection();
                        onResetPage();
                        onRefetchEmails();
                    } else {
                        toast.error(
                            targetIds.length > 1
                                ? 'Failed to delete emails. Please retry in some time.'
                                : 'Failed to delete email. Please retry in some time.',
                            { duration: 4000 },
                        );
                        onRefetchEmails();
                    }
                },
                onError: (error: Error) => {
                    console.error('Error deleting email:', error);
                    onRefetchEmails();
                },
            },
        );
    };

    const options = [
        {
            id: 1,
            label: 'Star',
            icon: Star,
            iconColor: 'text-yellow-500',
            action: handleStar,
        },
        {
            id: 2,
            label: 'Mark as Unread',
            icon: MailCheck,
            iconColor: 'text-blue-500',
            action: handleToggleUnread,
        },
        {
            id: 3,
            label: 'Archive',
            icon: Archive,
            iconColor: 'text-emerald-500',
            action: handleArchive,
        },
        {
            id: 4,
            label: 'Delete',
            icon: Trash2,
            iconColor: 'text-red-500',
            action: () => setShowDeleteModal(true),
        },
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
