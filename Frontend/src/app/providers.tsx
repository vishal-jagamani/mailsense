'use client';

import { ThemeProvider } from '@/shared/components/theme-provider';
import { useResetBreadcrumb } from '@/shared/hooks/useResetBreadcrumb';
import AuthProvider from '@/shared/providers/auth.provider';
import { Toaster } from '@/shared/ui/sonner';
import { Auth0Provider } from '@auth0/nextjs-auth0';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
    useResetBreadcrumb();

    return (
        <>
            <Auth0Provider user={undefined}>
                <AuthProvider>
                    <QueryClientProvider client={queryClient}>
                        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                            {/* <div className="flex h-screen w-screen">{children}</div> */}
                            {children}
                            <Toaster richColors />
                        </ThemeProvider>
                    </QueryClientProvider>
                </AuthProvider>
            </Auth0Provider>
        </>
    );
}
