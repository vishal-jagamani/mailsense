'use client';

import { AppSidebar } from '@/shared/components/sidebar/app-sidebar';
import { useAuthStore } from '@/shared/store';
import { SidebarProvider, SidebarTrigger } from '@/shared/ui/sidebar';

export default function HomeLayout({ children }: { children: React.ReactNode }) {
    const { isLoading } = useAuthStore();

    if (isLoading) return <div>Loading...</div>;

    return (
        <>
            <SidebarProvider>
                <AppSidebar />
                <main className="flex-1">
                    <SidebarTrigger />
                    {children}
                </main>
            </SidebarProvider>
        </>
    );
}
