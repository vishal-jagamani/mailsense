'use client';

import { Separator } from '@/shared/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';
import { Archive, ArrowLeft, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';

interface EmailMenuBarOptionsProps {
    accountId: string;
    emailId: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const EmailMenuBarOptions: React.FC<EmailMenuBarOptionsProps> = ({ accountId, emailId }) => {
    const router = useRouter();
    const options = [
        {
            id: 1,
            label: 'Archive',
            icon: Archive,
            action: () => console.log('Archive'),
        },
        {
            id: 2,
            label: 'Delete',
            icon: Trash,
            iconColor: 'text-red-500',
            action: () => console.log('Delete'),
        },
    ];

    return (
        <>
            <div className="flex h-8 items-center gap-6 rounded-t-md bg-neutral-900 p-1 px-2">
                <ArrowLeft size={18} onClick={() => router.back()} className="cursor-pointer" />
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
                <Separator orientation="vertical" className="w-10" />
            </div>
        </>
    );
};

export default EmailMenuBarOptions;
