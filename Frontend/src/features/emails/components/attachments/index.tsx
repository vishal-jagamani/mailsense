'use client';

import React, { useState } from 'react';

import { handleDownload, handlePreview } from '@features/emails/utils/attachments';
import { EmailAttachment } from '@mailsense/types';
import { Download, Eye, Loader2 } from 'lucide-react';
import AttachmentPreview from './AttachmentPreview';

interface AttachmentListProps {
    emailId: string;
    attachments: EmailAttachment[];
}

const AttachmentList: React.FC<AttachmentListProps> = ({ emailId, attachments }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loadingAttId, setLoadingAttId] = useState<string | null>(null);

    if (!attachments || attachments.length === 0) return null;

    const closePreview = () => {
        if (previewUrl) {
            window.URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
    };

    return (
        <div className="mt-4 border-t border-gray-100 px-4 pt-4 dark:border-gray-800">
            <h4 className="mb-3 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                Attachments ({attachments.length})
            </h4>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {attachments.map((att) => {
                    const isImage = att.mimeType.startsWith('image/');
                    const isLoading = loadingAttId === att.attachmentId;

                    return (
                        <div
                            key={att.attachmentId}
                            className="group flex items-center justify-between rounded-lg border border-sky-700 bg-sky-900 p-3"
                        >
                            <span className="truncate text-xs font-medium">{att.filename}</span>
                            <div className="ml-2 flex items-center gap-1">
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                ) : (
                                    <>
                                        {isImage && (
                                            <button
                                                onClick={() => handlePreview(emailId, att.attachmentId, setLoadingAttId, setPreviewUrl)}
                                                className="cursor-pointer rounded p-1.5 hover:bg-sky-700"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDownload(emailId, att.attachmentId, att.filename, setLoadingAttId)}
                                            className="cursor-pointer rounded p-1.5 hover:bg-sky-700"
                                        >
                                            <Download className="h-3.5 w-3.5" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <AttachmentPreview previewUrl={previewUrl} closePreview={closePreview} />
        </div>
    );
};

export default AttachmentList;
