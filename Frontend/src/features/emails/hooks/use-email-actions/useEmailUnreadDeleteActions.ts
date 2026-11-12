import { useUnreadEmailMutation } from '@features/emails/api/email.mutations';
import { UseEmailActionsOptions } from '@features/emails/types/email-ui.types';
import { useDeleteEmail } from '@features/inbox/api/inbox.queries';
import { EmailAttributes } from '@mailsense/types';
import { useState } from 'react';
import { toast } from 'sonner';

export const useEmailUnreadDeleteActions = (params: UseEmailActionsOptions) => {
    const { emailsData, selectedEmails, setEmailsData, onRefresh, onClearSelection } = params;

    const [emailsToDelete, setEmailsToDelete] = useState<string[]>([]);
    const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);

    const { mutate: unreadEmailMutate } = useUnreadEmailMutation();
    const { mutate: deleteEmailMutate, isPending: isDeleting } = useDeleteEmail();

    const handleUnread = (email?: EmailAttributes): void => {
        const targetIds = selectedEmails.length > 0 ? [...selectedEmails] : email ? [email._id] : [];
        if (targetIds.length === 0) return;

        let nextUnread = true;
        if (emailsData?.data) {
            const targetEmails = emailsData.data.filter((item) => targetIds.includes(item._id));
            const allUnread = targetEmails.length > 0 && targetEmails.every((item) => !item.isRead);
            nextUnread = !allUnread;
        } else if (email) {
            nextUnread = email.isRead;
        }

        const previousData = emailsData;
        setEmailsData((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                data: prev.data.map((item) => (targetIds.includes(item._id) ? { ...item, isRead: !nextUnread } : item)),
            };
        });

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
                        onRefresh();
                    } else {
                        toast.error('Failed to update read status. Please retry in some time.', { duration: 4000 });
                        setEmailsData(previousData);
                        onRefresh();
                    }
                },
                onError: () => {
                    setEmailsData(previousData);
                    onRefresh();
                },
            },
        );
    };

    const handlePromptDelete = (email?: EmailAttributes): void => {
        const targetIds = selectedEmails.length > 0 ? [...selectedEmails] : email ? [email._id] : [];
        if (targetIds.length === 0) return;
        setEmailsToDelete(targetIds);
    };

    const handleConfirmDelete = (): void => {
        if (emailsToDelete.length === 0) return;
        const targetIds = [...emailsToDelete];
        const previousData = emailsData;

        setEmailsData((prev) => {
            if (!prev) return prev;
            return { ...prev, data: prev.data.filter((item) => !targetIds.includes(item._id)) };
        });

        deleteEmailMutate(
            { emailIds: targetIds, trash: true },
            {
                onSuccess: (res) => {
                    if (res && res.status) {
                        toast.success(targetIds.length > 1 ? `${targetIds.length} emails deleted` : 'Email deleted', { duration: 3000 });
                        setEmailsToDelete([]);
                        onClearSelection?.();
                        onRefresh();
                    } else {
                        toast.error('Failed to delete emails. Please retry in some time.', { duration: 4000 });
                        setEmailsData(previousData);
                        onRefresh();
                    }
                },
                onError: () => {
                    setEmailsData(previousData);
                    onRefresh();
                },
            },
        );
    };

    return {
        states: { emailsToDelete, isShortcutsModalOpen },
        setters: { setEmailsToDelete, setIsShortcutsModalOpen },
        deleteEmail: { handlePromptDelete, handleConfirmDelete, loading: isDeleting },
        unreadEmail: { handleUnread },
    };
};
