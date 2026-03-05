'use client';

import React from 'react';

const MoreAccountProviderComingSoon: React.FC = () => {
    return (
        <>
            <div className="bg-sidebar flex flex-col gap-4 rounded-xl border p-4 text-center md:p-10 md:py-4">
                <div className="flex flex-col items-center justify-center gap-0">
                    <p className="text-md font-semibold">🚀 More connectors are on the way</p>
                    <p className="text-sm">✨Outlook is now available! We&apos;re working on bringing more email providers to you soon.</p>
                </div>
                <div className="flex items-center justify-center">
                    <p className="text-sm">💡 To get started, click &quot;Connect Account&quot; in the header and select your provider.</p>
                </div>
            </div>
        </>
    );
};

export default MoreAccountProviderComingSoon;
