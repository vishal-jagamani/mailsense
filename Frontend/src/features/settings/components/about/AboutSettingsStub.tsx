'use client';

import React from 'react';

const AboutSettingsStub: React.FC = () => {
    const version = process.env.NEXT_PUBLIC_APP_VERSION || '3.8.0';

    return (
        <div className="mt-4 max-w-2xl space-y-3 rounded-lg border p-6">
            <h2 className="text-lg font-semibold">About MailSense</h2>
            <p className="text-muted-foreground text-sm">
                Unified open-source inbox &amp; AI workspace (v{version}). Privacy disclosure, OAuth revocation guide, and feedback links will appear
                here.
            </p>
        </div>
    );
};

export default AboutSettingsStub;
