'use client';

import { MailCheck, Star, Trash } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

import DeleteModal from '@/modules/emails/components/DeleteModal';
import { useStarEmailMutation, useUnreadEmailMutation } from '@/modules/emails/services/useEmailApi';
import { useDeleteEmail } from '@/modules/home/services/useHomeApi';
import APILoader from '@/shared/components/apiLoader';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

interface EmailMenuBarOptionsProps {
    emailIds: string[];
}

const EmailMenuBarOptions: React.FC<EmailMenuBarOptionsProps> = ({ emailIds }) => {
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

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
            action: () => {
                unreadEmail({ emailIds, unread: true });
            },
        },
        // {
        //     id: 2,
        //     label: 'Forward',
        //     icon: Forward,
        //     action: () => console.log('Forward'),
        // },

        {
            id: 3,
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
            <div className="sticky top-0 z-40 flex h-10 max-h-10 min-h-10 items-center justify-between rounded-t-md px-4">
                <div className="flex items-center gap-6">
                    {options.map((option) => (
                        <div key={option.id} className="flex items-center">
                            <Tooltip>
                                <TooltipTrigger>
                                    <option.icon
                                        size={18}
                                        onClick={emailIds.length > 0 ? option.action : undefined}
                                        className={`${option.iconColor ?? ''} ${emailIds.length > 0 ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                                    />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className={`text-md font-semibold ${emailIds.length > 0 ? '' : 'opacity-50'}`}>{option.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    ))}
                    <DeleteModal open={showDeleteModal} onOpenChange={setShowDeleteModal} onDelete={() => deleteEmail({ emailIds, trash: true })} />
                </div>
            </div>
        </>
    );
};

export default EmailMenuBarOptions;
