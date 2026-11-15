import { useUnreadEmailMutation } from '@features/emails/api/email.mutations';
import { useDeleteEmail } from '@features/inbox/api/inbox.queries';
import { UseInboxEmailUnreadDeleteActions, UseInboxEmailUnreadDeleteActionsReturn } from '@features/inbox/types/inbox.types';
import { toast } from 'sonner';

export const useInboxEmailUnreadDeleteActions = (params: UseInboxEmailUnreadDeleteActions): UseInboxEmailUnreadDeleteActionsReturn => {
    const { emailIds, allEmails, handleActionSuccess, onRefetchEmails, setShowDeleteModal } = params;

    const { mutate: unreadEmailMutate, isPending: unreadEmailLoading } = useUnreadEmailMutation();
    const { mutate: deleteEmailMutate, isPending: deleteEmailLoading } = useDeleteEmail();

    const handleUnread = (): void => {
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

    return {
        unreadAction: { handleUnread, unreadEmailLoading },
        deleteAction: { handleDelete: handleConfirmDelete, deleteEmailLoading },
    };
};
