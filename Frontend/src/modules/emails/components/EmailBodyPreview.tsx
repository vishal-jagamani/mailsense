'use client';

import React, { useMemo, useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';

interface EmailBodyPreviewProps {
    html?: string | null;
    plain?: string | null;
}

const EmailBodyPreview: React.FC<EmailBodyPreviewProps> = ({ html, plain }) => {
    const [showImages, setShowImages] = useState(false);

    const sanitizedHtml = useMemo(() => {
        if (!html) return plain;
        return DOMPurify.sanitize(html, {
            USE_PROFILES: { html: true },
            FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'style'],
            FORBID_ATTR: ['onerror', 'onclick'],
            ADD_ATTR: ['target'],
            ALLOW_DATA_ATTR: false,
            RETURN_DOM: false,
            WHOLE_DOCUMENT: false,
            ALLOWED_URI_REGEXP: showImages ? undefined : /^(?!http|https|data:image)/i,
        });
    }, [html, plain, showImages]);

    // 🟡 Plaintext fallback
    if (!html && plain) {
        return <pre className="font-sans text-sm whitespace-pre-wrap text-gray-800 dark:text-gray-200">{plain}</pre>;
    }

    return (
        <div className="max-w-none overflow-y-auto font-sans text-sm leading-relaxed text-gray-800 dark:text-gray-100 px-4 pb-4">
            {!showImages && (
                <div className="my-4">
                    <button
                        onClick={() => setShowImages(true)}
                        className="rounded bg-gray-200 px-2 py-1 text-xs hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                    >
                        Show Images
                    </button>
                </div>
            )}

            {/* 🧩 Wrap email HTML in a styled container */}
            <div
                className="[&_a]:text-blue-600 [&_a]:underline [&_a:hover]:opacity-80 [&_div]:mb-2 [&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-md [&_p]:mb-2 [&_span]:leading-relaxed [&_table]:border [&_td]:p-1"
                dangerouslySetInnerHTML={{ __html: sanitizedHtml || plain || '' }}
            />
        </div>
    );
};

export default EmailBodyPreview;
