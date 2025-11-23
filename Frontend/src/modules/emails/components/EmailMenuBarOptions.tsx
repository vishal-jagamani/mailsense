'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';
import { Archive, ArrowLeft, EllipsisVertical, Forward, MailX, Reply, Star, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import DeleteModal from './DeleteModal';
import { useArchiveEmailMutation } from '../services/useEmailApi';
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
    const [toastType, setToastType] = useState<string>('');
    const [toastMessage, setToastMessage] = useState<string>('');

    const { mutate: archiveEmail, isPending: archiveEmailLoading, data: archiveEmailSuccess, error: archiveEmailError } = useArchiveEmailMutation();

    useEffect(() => {
        if (archiveEmailSuccess) {
            setShowToast(true);
            setToastType('success');
            setToastMessage('Email archived successfully');
        }
        if (archiveEmailError) {
            setShowToast(true);
            setToastType('error');
            setToastMessage('Error archiving email');
        }
    }, [archiveEmailSuccess, archiveEmailError]);

    useEffect(() => {
        if (toastType) {
            if (toastType === 'success') {
                toast.success(toastMessage, {
                    duration: 3000,
                });
            }
            if (toastType === 'error') {
                toast.error(toastMessage, {
                    duration: 3000,
                });
            }
        }
    }, [showToast, toastType, toastMessage]);

    const options = [
        {
            id: 1,
            label: 'Mark as Unread',
            icon: MailX,
            action: () => console.log('Mark as Unread'),
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
            action: () => console.log('Star'),
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

    if (archiveEmailLoading) {
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
