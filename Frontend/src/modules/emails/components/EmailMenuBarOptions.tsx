'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';
import { Archive, ArrowLeft, EllipsisVertical, Forward, MailX, Reply, Star, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import DeleteModal from './DeleteModal';
import { useArchiveEmailMutation, useStarEmailMutation, useUnreadEmailMutation } from '../services/useEmailApi';
import { toast } from 'sonner';
import APILoader from '@/shared/components/apiLoader';

interface EmailMenuBarOptionsProps {
    accountId: string;
    emailId: string;
}

const EmailMenuBarOptions: React.FC<EmailMenuBarOptionsProps> = ({ emailId }) => {
    const router = useRouter();
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

    const [showToast, setShowToast] = useState<boolean>(false);

    const { mutate: archiveEmail, isPending: archiveEmailLoading, data: archiveEmailSuccess, error: archiveEmailError } = useArchiveEmailMutation();
    const { mutate: starEmail, isPending: starEmailLoading, data: starEmailSuccess, error: starEmailError } = useStarEmailMutation();
    const { mutate: unreadEmail, isPending: unreadEmailLoading, data: unreadEmailSuccess, error: unreadEmailError } = useUnreadEmailMutation();

    const mutationStates = [
        {
            success: archiveEmailSuccess,
            error: archiveEmailError,
            successMsg: 'Email archived successfully',
            errorMsg: 'Error archiving email',
        },
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
    }, [archiveEmailSuccess, archiveEmailError, starEmailSuccess, starEmailError, unreadEmailSuccess, unreadEmailError]);

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
            action: () => unreadEmail({ emailIds: [emailId] }),
        },
        {
            id: 2,
            label: 'Reply',
            icon: Reply,
            action: () => console.log('Reply'),
        },
        {
            id: 3,
            label: 'Forward',
            icon: Forward,
            action: () => console.log('Forward'),
        },
        {
            id: 4,
            label: 'Star',
            icon: Star,
            action: () => starEmail({ emailIds: [emailId], star: true }),
        },
        {
            id: 5,
            label: 'Archive',
            icon: Archive,
            action: () => archiveEmail({ emailIds: [emailId], archive: true }),
        },
        {
            id: 6,
            label: 'Delete',
            icon: Trash,
            iconColor: 'text-red-500',
            action: () => setShowDeleteModal(true),
        },
        {
            id: 7,
            label: 'More',
            icon: EllipsisVertical,
            action: () => console.log('More'),
        },
    ];

    if (archiveEmailLoading || starEmailLoading || unreadEmailLoading) {
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
                    <DeleteModal open={showDeleteModal} onOpenChange={setShowDeleteModal} />
                </div>
            </div>
        </>
    );
};

export default EmailMenuBarOptions;
