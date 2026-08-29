'use client';

import { EmailAttributes } from '@mailsense/types';
import React from 'react';

import DeleteModal from '@features/emails/components/DeleteModal';
import MoveToFolderDropdown from '@features/emails/components/MoveToFolderDropdown';
import APILoader from '@shared/components/apiLoader';
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/tooltip';
import { useInboxEmailMenuBarOptions } from '../hooks';

interface EmailMenuBarOptionsProps {
    emailIds: string[];
    allEmails?: EmailAttributes[];
    onRefetchEmails: () => void;
    onResetSelection: () => void;
    onResetPage: () => void;
}

const EmailMenuBarOptions: React.FC<EmailMenuBarOptionsProps> = ({ emailIds, allEmails, onRefetchEmails, onResetSelection, onResetPage }) => {
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
                <div className="flex items-center gap-4">
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
                    <MoveToFolderDropdown
                        emailIds={emailIds}
                        allEmails={allEmails}
                        onSuccess={() => {
                            onResetSelection();
                            onRefetchEmails();
                        }}
                    />
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
