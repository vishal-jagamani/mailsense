'use client';

import { trackUserAction } from '@shared/monitoring';
import { ErrorFallbackProps } from '@shared/types';
import { AlertTriangle, Check, Copy, RefreshCw } from 'lucide-react';
import { useState } from 'react';

export function ErrorFallback({ error, traceId, resetErrorBoundary }: ErrorFallbackProps) {
    const [copied, setCopied] = useState<boolean>(false);

    const handleCopyTraceId = async (): Promise<void> => {
        try {
            await navigator.clipboard.writeText(traceId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            trackUserAction('ui.click', 'Failed to copy trace ID to clipboard', 'warn');
        }
    };

    return (
        <div className="flex min-h-100 flex-col items-center justify-center p-6 text-center">
            <div className="mb-4 rounded-full bg-red-100 p-4 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                <AlertTriangle className="h-8 w-8" />
            </div>
            <h2 className="mb-2 text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">Something unexpected occurred</h2>
            <p className="mb-4 max-w-md text-sm text-neutral-600 dark:text-neutral-400">
                {error.message || 'An unexpected rendering error was encountered.'}
            </p>
            {traceId && (
                <div className="mb-6 flex items-center gap-2 rounded-md bg-neutral-100 px-3 py-1.5 font-mono text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                    <span>Trace: {traceId}</span>
                    <button
                        onClick={handleCopyTraceId}
                        className="p-1 hover:text-neutral-900 dark:hover:text-neutral-100"
                        title="Copy Trace ID"
                        type="button"
                    >
                        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                </div>
            )}
            <button
                onClick={resetErrorBoundary}
                className="flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                type="button"
            >
                <RefreshCw className="h-4 w-4" />
                Retry view
            </button>
        </div>
    );
}
