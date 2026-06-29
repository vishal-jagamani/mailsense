'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';

import APILoader from '@shared/components/apiLoader';
import { useIsMobile } from '@shared/hooks';
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/tooltip';
import { useEmailMenuBarOptions } from '../hooks/useEmailMenuBarOptions';
import DeleteModal from './DeleteModal';

interface EmailMenuBarOptionsProps {
    accountId: string;
    emailId: string;
    onManualUnreadOperation?: () => void;
}

const EmailMenuBarOptions: React.FC<EmailMenuBarOptionsProps> = ({ emailId, onManualUnreadOperation }) => {
    const isMobile = useIsMobile();
    const router = useRouter();

    const {
        states: { showDeleteModal },
        setters: { setShowDeleteModal },
        actionOptions: options,
        starEmail: { isLoading: starEmailLoading },
        unreadEmail: { isLoading: unreadEmailLoading },
        deleteEmail: { mutate: deleteEmail, isLoading: deleteEmailLoading },
    } = useEmailMenuBarOptions(emailId, onManualUnreadOperation);

    if (starEmailLoading || unreadEmailLoading || deleteEmailLoading) {
        return <APILoader show size="small" />;
    }

    return (
        <>
            <div className="bg-sidebar sticky top-0 z-40 flex h-10 max-h-10 min-h-10 items-center justify-between rounded-t-md px-4">
                <ArrowLeft size={isMobile ? 16 : 18} onClick={() => router.back()} className="cursor-pointer" />
                <div className="flex items-center gap-6">
                    {options.map((option) => (
                        <div key={option.id} className="flex items-center">
                            <Tooltip>
                                <TooltipTrigger>
                                    <option.icon
                                        size={isMobile ? 16 : 18}
                                        onClick={option.action}
                                        className={`cursor-pointer ${option.iconColor ?? ''}`}
                                    />
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
