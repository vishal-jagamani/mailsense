'use client';

import { Paperclip } from 'lucide-react';
import React from 'react';

interface AttachmentBadgeProps {
    count?: number;
}

const AttachmentBadge: React.FC<AttachmentBadgeProps> = ({ count }) => {
    if (!count || count <= 0) return null;

    return (
        <span className="inline-flex items-center gap-1 text-gray-400 dark:text-gray-500">
            <Paperclip className="h-3 w-3" />
            {count > 1 && <span className="text-[10px] font-medium">{count}</span>}
        </span>
    );
};

export default AttachmentBadge;
