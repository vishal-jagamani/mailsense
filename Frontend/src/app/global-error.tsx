'use client';

import * as Sentry from '@sentry/nextjs';
import { GlobalErrorProps } from '@shared/types';
import { Button } from '@shared/ui/button';
import { useEffect, useState } from 'react';

export default function GlobalError({ error, reset }: GlobalErrorProps) {
    const [traceId] = useState<string>(() => (typeof crypto !== 'undefined' ? crypto.randomUUID() : ''));

    useEffect(() => {
        Sentry.captureException(error, {
            tags: { boundary: 'app-global-error', traceId },
        });
    }, [error, traceId]);

    return (
        <html lang="en">
            <body className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 p-6 text-center text-neutral-100">
                <div className="max-w-md space-y-4 rounded-xl border border-neutral-800 bg-neutral-900 p-8">
                    <h1 className="text-xl font-semibold">MailSense encountered an unexpected error</h1>
                    <p className="text-sm text-neutral-400">
                        {error.message || 'An unexpected application fault occurred. Please try reloading the workspace.'}
                    </p>
                    {traceId && <p className="rounded bg-neutral-950 px-3 py-1.5 font-mono text-xs text-neutral-400">Trace ID: {traceId}</p>}
                    <Button
                        type="button"
                        onClick={reset}
                        className="cursor-pointer rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-200"
                    >
                        Reload Application
                    </Button>
                </div>
            </body>
        </html>
    );
}
