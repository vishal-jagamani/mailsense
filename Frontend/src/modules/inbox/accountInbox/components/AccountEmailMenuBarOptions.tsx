'use client';

import { MailCheck, Star, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import DeleteModal from '@/modules/emails/components/DeleteModal';
import { useStarEmailMutation, useUnreadEmailMutation } from '@/modules/emails/services/useEmailApi';
import { useDeleteEmail } from '@/modules/home/services/useHomeApi';
import APILoader from '@/shared/components/apiLoader';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

interface AccountEmailMenuBarOptionsProps {
    emailIds: string[];
    onRefetchEmails: () => void;
    onResetSelection: () => void;
    onResetPage: () => void;
}

const AccountEmailMenuBarOptions: React.FC<AccountEmailMenuBarOptionsProps> = ({ emailIds, onRefetchEmails, onResetSelection, onResetPage }) => {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const { mutate: deleteEmail, isPending: deleteEmailLoading, data: deleteEmailSuccess } = useDeleteEmail();
    const { mutate: starEmail, isPending: starEmailLoading, data: starEmailSuccess } = useStarEmailMutation();
    const { mutate: unreadEmail, isPending: unreadEmailLoading, data: unreadEmailSuccess } = useUnreadEmailMutation();

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
            <DeleteModal
                open={showDeleteModal}
                onOpenChange={setShowDeleteModal}
                onDelete={() => {
                    deleteEmail({ emailIds, trash: true });
                }}
            />
        </>
    );
};

export default AccountEmailMenuBarOptions;
