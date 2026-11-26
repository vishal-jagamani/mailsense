'use client';

import { reportClientError } from '@shared/api';
import { frontendMonitoring, trackUserAction } from '@shared/monitoring';
import { ErrorBoundaryContextValue, ErrorBoundaryFallbackProps, ErrorBoundaryInternalState, ErrorBoundaryProps } from '@shared/types';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { ErrorFallback } from './ErrorFallback';

export type { ErrorBoundaryContextValue, ErrorBoundaryFallbackProps, ErrorBoundaryProps };

const ErrorBoundaryContext = createContext<ErrorBoundaryContextValue | null>(null);

const dispatchClientErrorReport = (error: Error, traceId: string): void => {
    const pageUrl = typeof window !== 'undefined' ? window.location.pathname : 'unknown';
    void reportClientError({
        message: error.message || 'Unhandled frontend crash',
        stack: error.stack,
        traceId,
        pageUrl,
        appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '3.8.0',
    });
};

/**
 * Hook allowing any child component or hook to trigger the ErrorBoundary
 */
export function useErrorBoundary(): ErrorBoundaryContextValue {
    try {
        const context = useContext(ErrorBoundaryContext);
        if (!context) {
            return {
                showBoundary: (error: Error): void => {
                    frontendMonitoring.captureException(error);
                },
                resetBoundary: (): void => {
                    if (typeof window !== 'undefined') {
                        window.location.reload();
                    }
                },
            };
        }
        return context;
    } catch {
        return {
            showBoundary: (error: Error): void => {
                frontendMonitoring.captureException(error);
            },
            resetBoundary: (): void => {
                if (typeof window !== 'undefined') {
                    window.location.reload();
                }
            },
        };
    }
}

/**
 * Functional Error Boundary component that captures runtime errors,
 * logs distributed trace context, and renders fallback UI.
 */
export function ErrorBoundary({ children, fallbackRender, onError }: ErrorBoundaryProps): ReactNode {
    const [errorState, setErrorState] = useState<ErrorBoundaryInternalState | null>(null);

    const handleReset = useCallback((): void => {
        try {
            setErrorState(null);
            if (typeof window !== 'undefined') {
                window.location.reload();
            }
        } catch {
            trackUserAction('navigation', 'Failed to reset error boundary', 'error');
        }
    }, []);

    const showBoundary = useCallback(
        (error: Error): void => {
            try {
                const traceId = crypto.randomUUID();
                setErrorState({ error, traceId });

                frontendMonitoring.captureException(error, {
                    traceId,
                    route: typeof window !== 'undefined' ? window.location.pathname : undefined,
                });
                dispatchClientErrorReport(error, traceId);

                if (onError) {
                    onError(error, traceId);
                }
            } catch {
                trackUserAction('ui.click', 'Failed to capture manual boundary error', 'error');
            }
        },
        [onError],
    );

    useEffect(() => {
        const handleError = (event: ErrorEvent): void => {
            try {
                const error = event.error instanceof Error ? event.error : new Error(event.message || 'Unknown runtime error');
                const traceId = crypto.randomUUID();

                setErrorState({ error, traceId });

                frontendMonitoring.captureException(error, {
                    traceId,
                    route: typeof window !== 'undefined' ? window.location.pathname : undefined,
                });
                dispatchClientErrorReport(error, traceId);

                if (onError) {
                    onError(error, traceId);
                }
            } catch {
                trackUserAction('ui.click', 'Failed to capture window error in ErrorBoundary', 'error');
            }
        };

        const handleRejection = (event: PromiseRejectionEvent): void => {
            try {
                const reason = event.reason;
                const error = reason instanceof Error ? reason : new Error(typeof reason === 'string' ? reason : 'Unhandled asynchronous rejection');
                const traceId = crypto.randomUUID();

                setErrorState({ error, traceId });

                frontendMonitoring.captureException(error, {
                    traceId,
                    route: typeof window !== 'undefined' ? window.location.pathname : undefined,
                });
                dispatchClientErrorReport(error, traceId);

                if (onError) {
                    onError(error, traceId);
                }
            } catch {
                trackUserAction('ui.click', 'Failed to capture unhandled rejection in ErrorBoundary', 'error');
            }
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleRejection);

        return (): void => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleRejection);
        };
    }, [onError]);

    if (errorState) {
        if (fallbackRender) {
            return fallbackRender({
                error: errorState.error,
                traceId: errorState.traceId,
                resetErrorBoundary: handleReset,
            });
        }

        return (
            <div className="bg-background text-foreground flex min-h-screen w-full items-center justify-center p-4">
                <ErrorFallback error={errorState.error} traceId={errorState.traceId} resetErrorBoundary={handleReset} />
            </div>
        );
    }

    return <ErrorBoundaryContext.Provider value={{ showBoundary, resetBoundary: handleReset }}>{children}</ErrorBoundaryContext.Provider>;
}
