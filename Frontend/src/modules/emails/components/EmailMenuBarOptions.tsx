'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';
import { Archive, ArrowLeft, EllipsisVertical, Forward, MailX, Reply, Star, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import DeleteModal from './DeleteModal';

interface EmailMenuBarOptionsProps {
    accountId: string;
    emailId: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const EmailMenuBarOptions: React.FC<EmailMenuBarOptionsProps> = ({ accountId, emailId }) => {
    const router = useRouter();
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

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
            action: () => console.log('Archive'),
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

    return (
        <>
            <div className="bg-sidebar sticky top-0 z-40 flex h-10 max-h-10 min-h-10 items-center justify-between rounded-t-md px-4">
                <ArrowLeft size={18} onClick={() => router.back()} className="cursor-pointer" />
                <div className="flex items-center gap-6">
                    {options.map((option) => (
                        <div key={option.id} className="flex items-center">
                            <Tooltip>
                                <TooltipTrigger>
                                    <option.icon size={18} onClick={option.action} className={`cursor-pointer ${option.iconColor || ''}`} />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="text-md font-semibold">{option.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    ))}
                    <DeleteModal open={showDeleteModal} onOpenChange={setShowDeleteModal} />
                    {/* <Separator orientation="vertical" className="w-10" /> */}
                </div>
            </div>
        </>
    );
};

export default EmailMenuBarOptions;
