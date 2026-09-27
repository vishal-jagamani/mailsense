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
        actions: { handleConfirmDelete },
        starEmail: { isLoading: isStarEmailLoading },
        unreadEmail: { isLoading: isUnreadEmailLoading },
        archiveEmail: { isLoading: isArchiveEmailLoading },
        deleteEmail: { isLoading: isDeleteEmailLoading },
    } = useInboxEmailMenuBarOptions({
        emailIds,
        allEmails,
        onRefetchEmails,
        onResetPage,
        onResetSelection,
    });

    if (isStarEmailLoading || isUnreadEmailLoading || isArchiveEmailLoading || isDeleteEmailLoading) {
        return <APILoader show size="small" />;
    }

    return (
        <>
            <div className="sticky top-0 z-40 flex h-10 max-h-10 min-h-10 items-center justify-between rounded-t-md">
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
                        onDelete={handleConfirmDelete}
                        title={emailIds.length > 1 ? 'Delete Emails' : 'Delete Email'}
                        description={
                            emailIds.length > 1
                                ? `Are you sure you want to delete ${emailIds.length} emails?`
                                : 'Are you sure you want to delete this email?'
                        }
                    />
                </div>
            </div>
        </>
    );
};

export default EmailMenuBarOptions;
