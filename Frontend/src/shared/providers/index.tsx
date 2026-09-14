'use client';

import { Auth0Provider } from '@auth0/nextjs-auth0';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
import { ThemeProvider } from '@shared/components/theme-provider';
import { useResetBreadcrumb } from '@shared/hooks';
import { frontendMonitoring } from '@shared/monitoring';
import { Toaster } from '@shared/ui/sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import AuthProvider from './auth.provider';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
    useResetBreadcrumb();

    useEffect(() => {
        try {
            frontendMonitoring.init();
        } catch (initError) {
            console.error('Failed to initialize frontend monitoring in Providers:', initError);
        }
    }, []);

    return (
        <ErrorBoundary>
            <Auth0Provider user={undefined}>
                <AuthProvider>
                    <QueryClientProvider client={queryClient}>
                        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                            {children}
                            <Toaster richColors />
                        </ThemeProvider>
                    </QueryClientProvider>
                </AuthProvider>
            </Auth0Provider>
        </ErrorBoundary>
    );
}
