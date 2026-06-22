'use client';

import React from 'react';

import DeleteModal from '@features/emails/components/DeleteModal';
import APILoader from '@shared/components/apiLoader';
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/tooltip';
import { useInboxEmailMenuBarOptions } from '../hooks';

interface EmailMenuBarOptionsProps {
    emailIds: string[];
    onRefetchEmails: () => void;
    onResetSelection: () => void;
    onResetPage: () => void;
}

const EmailMenuBarOptions: React.FC<EmailMenuBarOptionsProps> = ({ emailIds, onRefetchEmails, onResetSelection, onResetPage }) => {
    const {
        states: { showDeleteModal },
        setters: { setShowDeleteModal },
        actionOptions: options,
        starEmail: { isLoading: isStarEmailLoading },
        unreadEmail: { isLoading: isUnreadEmailLoading },
        deleteEmail: { mutate: deleteEmail, isLoading: isDeleteEmailLoading },
    } = useInboxEmailMenuBarOptions({
        emailIds,
        onRefetchEmails,
        onResetPage,
        onResetSelection,
    });

    if (isStarEmailLoading || isUnreadEmailLoading || isDeleteEmailLoading) {
        return <APILoader show size="small" />;
    }

    return (
        <>
            <div className="sticky top-0 z-40 flex h-10 max-h-10 min-h-10 items-center justify-between rounded-t-md md:px-4">
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
                    <DeleteModal
                        open={showDeleteModal}
                        onOpenChange={setShowDeleteModal}
                        onDelete={() => {
                            deleteEmail({ emailIds, trash: true });
                        }}
                    />
                </div>
            </div>
        </>
    );
};

export default EmailMenuBarOptions;
