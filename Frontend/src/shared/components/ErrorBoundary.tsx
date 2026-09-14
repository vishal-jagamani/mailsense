'use client';

import { frontendMonitoring } from '@shared/monitoring';
import { AlertTriangle, Check, Copy, RefreshCw } from 'lucide-react';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

export interface ErrorBoundaryFallbackProps {
    error: Error;
    traceId: string;
    resetErrorBoundary: () => void;
}

export interface ErrorBoundaryProps {
    children: ReactNode;
    fallbackRender?: (props: ErrorBoundaryFallbackProps) => ReactNode;
    onError?: (error: Error, traceId: string) => void;
}

export interface ErrorBoundaryContextValue {
    showBoundary: (error: Error) => void;
    resetBoundary: () => void;
}

interface ErrorBoundaryInternalState {
    error: Error;
    traceId: string;
}

const ErrorBoundaryContext = createContext<ErrorBoundaryContextValue | null>(null);

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
    const [copied, setCopied] = useState<boolean>(false);

    const handleReset = useCallback((): void => {
        try {
            setErrorState(null);
            setCopied(false);
            if (typeof window !== 'undefined') {
                window.location.reload();
            }
        } catch (resetError) {
            console.error('Failed to reset error boundary:', resetError);
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

                if (onError) {
                    onError(error, traceId);
                }
            } catch (captureError) {
                console.error('Failed to capture manual boundary error:', captureError);
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

                if (onError) {
                    onError(error, traceId);
                }
            } catch (listenerError) {
                console.error('Failed to capture window error in ErrorBoundary:', listenerError);
            }
        };

        const handleRejection = (event: PromiseRejectionEvent): void => {
            try {
                const reason = event.reason;
                const error =
                    reason instanceof Error
                        ? reason
                        : new Error(typeof reason === 'string' ? reason : 'Unhandled asynchronous rejection');
                const traceId = crypto.randomUUID();

                setErrorState({ error, traceId });

                frontendMonitoring.captureException(error, {
                    traceId,
                    route: typeof window !== 'undefined' ? window.location.pathname : undefined,
                });

                if (onError) {
                    onError(error, traceId);
                }
            } catch (rejectionError) {
                console.error('Failed to capture unhandled rejection in ErrorBoundary:', rejectionError);
            }
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleRejection);

        return (): void => {
            try {
                window.removeEventListener('error', handleError);
                window.removeEventListener('unhandledrejection', handleRejection);
            } catch {
                // Non-blocking cleanup
            }
        };
    }, [onError]);

    const handleCopyTraceId = useCallback(async (): Promise<void> => {
        try {
            if (errorState?.traceId && typeof navigator !== 'undefined' && navigator.clipboard) {
                await navigator.clipboard.writeText(errorState.traceId);
                setCopied(true);
                setTimeout(() => {
                    try {
                        setCopied(false);
                    } catch {
                        // Non-blocking
                    }
                }, 2000);
            }
        } catch (copyError) {
            console.error('Failed to copy trace ID to clipboard:', copyError);
        }
    }, [errorState?.traceId]);

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
                <div className="border-destructive/30 bg-card/90 animate-in fade-in zoom-in-95 relative w-full max-w-lg overflow-hidden rounded-2xl border p-8 shadow-2xl backdrop-blur-xl duration-200">
                    {/* Glowing backdrop accent */}
                    <div className="bg-destructive/15 absolute -top-16 -right-16 h-36 w-36 rounded-full blur-3xl" />
                    <div className="bg-primary/10 absolute -bottom-16 -left-16 h-36 w-36 rounded-full blur-3xl" />

                    <div className="flex flex-col items-center text-center">
                        <div className="bg-destructive/10 text-destructive border-destructive/20 mb-4 flex h-14 w-14 items-center justify-center rounded-full border shadow-inner">
                            <AlertTriangle className="h-7 w-7" />
                        </div>

                        <h2 className="text-foreground text-2xl font-bold tracking-tight">Something went wrong</h2>
                        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                            An unexpected visual rendering error occurred. Our engineering team has been automatically alerted with session
                            context.
                        </p>

                        {/* Trace ID Pill */}
                        {errorState.traceId ? (
                            <div className="border-border/60 bg-muted/40 mt-6 w-full rounded-lg border p-3 text-left">
                                <div className="text-muted-foreground mb-1.5 flex items-center justify-between text-xs">
                                    <span className="font-semibold tracking-wider uppercase">Incident Trace ID</span>
                                    <span>Reference this when contacting support</span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <code className="text-foreground truncate font-mono text-xs select-all">{errorState.traceId}</code>
                                    <button
                                        type="button"
                                        onClick={handleCopyTraceId}
                                        className="text-muted-foreground hover:text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
                                        title="Copy Trace ID to clipboard"
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                                                <span className="text-emerald-500">Copied</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-3.5 w-3.5" />
                                                <span>Copy</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : null}

                        {/* Actions */}
                        <div className="mt-6 flex w-full gap-3">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="bg-primary text-primary-foreground inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow transition-transform hover:opacity-90 active:scale-[0.98]"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Reload Application
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundaryContext.Provider value={{ showBoundary, resetBoundary: handleReset }}>
            {children}
        </ErrorBoundaryContext.Provider>
    );
}
