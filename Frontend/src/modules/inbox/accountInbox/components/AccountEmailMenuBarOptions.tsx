'use client';

import { MailCheck, Star, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

import { useStarEmailMutation, useUnreadEmailMutation } from '@/modules/emails/services/useEmailApi';
import { useDeleteEmail } from '@/modules/home/services/useHomeApi';
import APILoader from '@/shared/components/apiLoader';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';
import DeleteModal from '@/modules/emails/components/DeleteModal';

interface AccountEmailMenuBarOptionsProps {
    emailIds: string[];
}

const AccountEmailMenuBarOptions: React.FC<AccountEmailMenuBarOptionsProps> = ({ emailIds }) => {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const { mutate: deleteEmail, isPending: deleteEmailLoading } = useDeleteEmail();
    const { mutate: starEmail, isPending: starEmailLoading } = useStarEmailMutation();
    const { mutate: unreadEmail, isPending: unreadEmailLoading } = useUnreadEmailMutation();

    const options = [
        // {
        //     id: 1,
        //     label: 'Star',
        //     icon: Star,
        //     iconColor: 'text-yellow-500',
        //     action: () => starEmail({ emailIds, star: true }),
        // },
        {
            id: 2,
            label: 'Star',
            icon: Star,
            iconColor: 'text-yellow-500',
            action: () => starEmail({ emailIds, star: true }),
        },
        {
            id: 3,
            label: 'Mark as Unread',
            icon: MailCheck,
            iconColor: 'text-blue-500',
            action: () => unreadEmail({ emailIds, unread: true }),
        },
        {
            id: 4,
            label: 'Delete',
            icon: Trash2,
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
                </div>
            </div>
            <DeleteModal open={showDeleteModal} onOpenChange={setShowDeleteModal} onDelete={() => deleteEmail({ emailIds, trash: true })} />
        </>
    );
};

export default AccountEmailMenuBarOptions;
