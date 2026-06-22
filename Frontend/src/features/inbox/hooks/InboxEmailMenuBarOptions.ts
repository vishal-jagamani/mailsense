import { MailCheck, Star, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useStarEmailMutation, useUnreadEmailMutation } from '@features/emails/api/email.mutations';
import { useDeleteEmail } from '../api/inbox.queries';

interface InboxEmailMenuBarOptionsParams {
    emailIds: string[];
    onRefetchEmails: () => void;
    onResetSelection: () => void;
    onResetPage: () => void;
}

export const useInboxEmailMenuBarOptions = ({ emailIds, onRefetchEmails, onResetPage, onResetSelection }: InboxEmailMenuBarOptionsParams) => {
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

    const { mutate: starEmail, isPending: starEmailLoading, data: starEmailSuccess } = useStarEmailMutation();
    const { mutate: unreadEmail, isPending: unreadEmailLoading, data: unreadEmailSuccess } = useUnreadEmailMutation();
    const { mutate: deleteEmail, isPending: deleteEmailLoading, data: deleteEmailSuccess } = useDeleteEmail();

    useEffect(() => {
        const mutations = [
            { success: starEmailSuccess },
            { success: unreadEmailSuccess, hasStatus: true },
            { success: deleteEmailSuccess, hasStatus: true },
        ];

        const hasSuccessfulMutation = mutations.some((mutation) => mutation.success && (!mutation.hasStatus || mutation.success.status));

        if (hasSuccessfulMutation) {
            onResetSelection();
            onResetPage();
            setTimeout(() => {
                onRefetchEmails();
            }, 0);
        }
    }, [starEmailSuccess, unreadEmailSuccess, deleteEmailSuccess]);

    const options = [
        {
            id: 1,
            label: 'Star',
            icon: Star,
            iconColor: 'text-yellow-500',
            action: () => starEmail({ emailIds, star: true }),
        },
        {
            id: 2,
            label: 'Mark as Unread',
            icon: MailCheck,
            iconColor: 'text-blue-500',
            action: () => unreadEmail({ emailIds, unread: true }),
        },
        {
            id: 3,
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
        starEmail: { isLoading: starEmailLoading },
        unreadEmail: { isLoading: unreadEmailLoading },
        deleteEmail: { mutate: deleteEmail, isLoading: deleteEmailLoading },
    };
};
