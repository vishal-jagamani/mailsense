'use client';

import { AppSidebar } from '@/shared/components/sidebar/app-sidebar';
import { useAuthStore } from '@/store';
import { SidebarProvider, SidebarTrigger } from '@/shared/ui/sidebar';

export default function HomeLayout({ children }: { children: React.ReactNode }) {
    const { isLoading } = useAuthStore();

    if (isLoading) return <div>Loading...</div>;

    return (
        <>
            <SidebarProvider>
                <div className="flex h-screen w-screen overflow-hidden">
                    <AppSidebar />
                    <main className="flex-1 overflow-x-hidden overflow-y-auto">
                        <SidebarTrigger className="absolute z-100 mt-1" />
                        {children}
                    </main>
                </div>
            </SidebarProvider>
        </>
    );
}
