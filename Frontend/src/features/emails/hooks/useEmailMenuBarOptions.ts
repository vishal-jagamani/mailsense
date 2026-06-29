import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useDeleteEmail } from '@features/inbox/api/inbox.queries';
import { HOME_ROUTES } from '@shared/constants';
import { MailX, Star, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useStarEmailMutation, useUnreadEmailMutation } from '../api/email.mutations';

export const useEmailMenuBarOptions = (emailId: string, onManualUnreadOperation?: () => void) => {
    const router = useRouter();
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

    const [showToast, setShowToast] = useState<boolean>(false);

    const { mutate: starEmail, isPending: starEmailLoading, data: starEmailSuccess, error: starEmailError } = useStarEmailMutation();
    const { mutate: unreadEmail, isPending: unreadEmailLoading, data: unreadEmailSuccess, error: unreadEmailError } = useUnreadEmailMutation();
    const { mutate: deleteEmail, isPending: deleteEmailLoading, data: deleteEmailSuccess, error: deleteEmailError } = useDeleteEmail();

    const mutationStates = [
        {
            success: starEmailSuccess,
            error: starEmailError,
            successMsg: 'Email starred successfully',
            errorMsg: 'Error starring email',
        },
        {
            success: unreadEmailSuccess,
            error: unreadEmailError,
            successMsg: 'Email marked unread successfully',
            errorMsg: 'Error marking email unread',
        },
        {
            success: deleteEmailSuccess,
            error: deleteEmailError,
            successMsg: 'Email deleted successfully',
            errorMsg: 'Error deleting email',
        },
    ];

    useEffect(() => {
        mutationStates.forEach((m) => {
            if (m.success) {
                toast.success(m.successMsg, { duration: 3000 });
            }
            if (m.error) {
                toast.error(m.errorMsg, { duration: 3000 });
            }
        });
    }, [starEmailSuccess, starEmailError, unreadEmailSuccess, unreadEmailError, deleteEmailSuccess, deleteEmailError]);

    useEffect(() => {
        if (deleteEmailSuccess) {
            router.push(HOME_ROUTES.UNIFIED_INBOX);
        }
    }, [deleteEmailSuccess]);

    useEffect(() => {
        if (showToast) {
            setTimeout(() => {
                setShowToast(false);
            }, 1000);
        }
    }, [showToast]);

    const options = [
        {
            id: 1,
            label: 'Star',
            icon: Star,
            action: () => starEmail({ emailIds: [emailId], star: true }),
        },
        {
            id: 2,
            label: 'Mark as Unread',
            icon: MailX,
            action: () => {
                onManualUnreadOperation?.();
                unreadEmail({ emailIds: [emailId], unread: true });
            },
        },
        {
            id: 3,
            label: 'Delete',
            icon: Trash,
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
