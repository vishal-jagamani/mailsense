'use client';

import { X } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

interface AttachmentPreviewProps {
    previewUrl: string | null;
    closePreview: () => void;
}

const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ previewUrl, closePreview }) => {
    if (!previewUrl) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="relative h-fit max-h-[85vh] w-fit max-w-[90vw] overflow-hidden rounded-xl">
                <button
                    type="button"
                    onClick={closePreview}
                    className="absolute top-4 right-4 z-10 flex size-8 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus:outline-none"
                    aria-label="Close preview"
                >
                    <X className="size-5" />
                </button>
                <Image src={previewUrl} alt="Preview" className="block h-auto max-h-[85vh] w-auto max-w-[90vw] rounded-xl object-contain" />
            </div>
        </div>
    );
};

export default AttachmentPreview;
