'use client';

import { ArrowLeft, MailX, Star, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useDeleteEmail } from '@/modules/home/services/useHomeApi';
import APILoader from '@/shared/components/apiLoader';
import { HOME_ROUTES } from '@/shared/constants';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';
import { useStarEmailMutation, useUnreadEmailMutation } from '../services/useEmailApi';
import DeleteModal from './DeleteModal';

interface EmailMenuBarOptionsProps {
    accountId: string;
    emailId: string;
    onManualUnreadOperation?: () => void;
}

const EmailMenuBarOptions: React.FC<EmailMenuBarOptionsProps> = ({ emailId, onManualUnreadOperation }) => {
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
            label: 'Mark as Unread',
            icon: MailX,
            action: () => {
                onManualUnreadOperation?.();
                unreadEmail({ emailIds: [emailId], unread: true });
            },
        },
        // {
        //     id: 2,
        //     label: 'Reply',
        //     icon: Reply,
        //     action: () => console.log('Reply'),
        // },
        // {
        //     id: 3,
        //     label: 'Forward',
        //     icon: Forward,
        //     action: () => console.log('Forward'),
        // },
        {
            id: 4,
            label: 'Star',
            icon: Star,
            action: () => starEmail({ emailIds: [emailId], star: true }),
        },
        {
            id: 5,
            label: 'Delete',
            icon: Trash,
            iconColor: 'text-red-500',
            action: () => setShowDeleteModal(true),
        },
    ];

    if (starEmailLoading || unreadEmailLoading || deleteEmailLoading) {
        return <APILoader show size="small" />;
    }

    return (
        <>
            <div className="bg-sidebar sticky top-0 z-40 flex h-10 max-h-10 min-h-10 items-center justify-between rounded-t-md px-4">
                <ArrowLeft size={18} onClick={() => router.back()} className="cursor-pointer" />
                <div className="flex items-center gap-6">
                    {options.map((option) => (
                        <div key={option.id} className="flex items-center">
                            <Tooltip>
                                <TooltipTrigger>
                                    <option.icon size={18} onClick={option.action} className={`cursor-pointer ${option.iconColor ?? ''}`} />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="text-md font-semibold">{option.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    ))}
                    <DeleteModal
                        open={showDeleteModal}
                        onOpenChange={setShowDeleteModal}
                        onDelete={() => deleteEmail({ emailIds: [emailId], trash: true })}
                    />
                </div>
            </div>
        </>
    );
};

export default EmailMenuBarOptions;
