'use client';

import { useDeleteEmail } from '@features/inbox/api/inbox.queries';
import { EmailAttributes } from '@mailsense/types';
import { useState } from 'react';
import { toast } from 'sonner';
import { useArchiveEmailMutation, useStarEmailMutation, useUnreadEmailMutation } from '../api/email.mutations';
import { UseEmailActionsOptions, UseEmailActionsReturn } from '../types/email-ui.types';

export function useEmailActions(options: UseEmailActionsOptions): UseEmailActionsReturn {
    const { selectedEmails, emailsData, setEmailsData, onRefresh, onClearSelection } = options;

    const [emailsToDelete, setEmailsToDelete] = useState<string[]>([]);
    const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);

    const { mutate: starEmailMutate } = useStarEmailMutation();
    const { mutate: unreadEmailMutate } = useUnreadEmailMutation();
    const { mutate: archiveEmailMutate } = useArchiveEmailMutation();
    const { mutate: deleteEmailMutate, isPending: isDeleting } = useDeleteEmail();

    const handleToggleStar = (email?: EmailAttributes): void => {
        const targetIds = selectedEmails.length > 0 ? [...selectedEmails] : email ? [email._id] : [];
        if (targetIds.length === 0) return;

        let nextStar = true;
        if (emailsData?.data) {
            const targetEmails = emailsData.data.filter((item) => targetIds.includes(item._id));
            const allStarred = targetEmails.length > 0 && targetEmails.every((item) => item.folders?.includes('STARRED'));
            nextStar = !allStarred;
        } else if (email) {
            nextStar = !email.folders?.includes('STARRED');
        }

        const previousData = emailsData;
        setEmailsData((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                data: prev.data.map((item) => {
                    if (targetIds.includes(item._id)) {
                        const currentFolders = item.folders || [];
                        const updatedFolders = nextStar
                            ? Array.from(new Set([...currentFolders, 'STARRED']))
                            : currentFolders.filter((f) => f.toUpperCase() !== 'STARRED');
                        return { ...item, folders: updatedFolders };
                    }
                    return item;
                }),
            };
        });

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
                        onRefresh();
                    } else {
                        toast.error('Failed to update star status. Please retry in some time.', { duration: 4000 });
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

    const handleToggleUnread = (email?: EmailAttributes): void => {
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

    const handleArchiveEmail = (email?: EmailAttributes): void => {
        const targetIds = selectedEmails.length > 0 ? [...selectedEmails] : email ? [email._id] : [];
        if (targetIds.length === 0) return;

        const previousData = emailsData;
        setEmailsData((prev) => {
            if (!prev) return prev;
            return { ...prev, data: prev.data.filter((item) => !targetIds.includes(item._id)) };
        });

        archiveEmailMutate(
            { emailIds: targetIds, archive: true },
            {
                onSuccess: (res) => {
                    if (res && res.status) {
                        toast.success(targetIds.length > 1 ? `${targetIds.length} emails archived` : 'Email archived', { duration: 3000 });
                        onClearSelection?.();
                        onRefresh();
                    } else {
                        toast.error('Failed to archive email. Please retry in some time.', { duration: 4000 });
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
        emailsToDelete,
        isShortcutsModalOpen,
        isDeleting,
        setEmailsToDelete,
        setIsShortcutsModalOpen,
        handleToggleStar,
        handleToggleUnread,
        handleArchiveEmail,
        handleConfirmDelete,
        handlePromptDelete,
    };
}
