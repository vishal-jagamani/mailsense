'use client';

import Loader from '@/shared/components/loader';
import { AppSidebar } from '@/shared/components/sidebar/app-sidebar';
import BreadcrumbComponent from '@/shared/components/breadcrumb';
import { SidebarProvider, SidebarTrigger } from '@/shared/ui/sidebar';
import { useAuthStore } from '@/store';

export default function HomeLayout({ children }: { children: React.ReactNode }) {
    const { isLoading } = useAuthStore();

    if (isLoading) return <Loader />;

    return (
        <>
            <SidebarProvider>
                <div className="flex h-screen w-screen overflow-hidden">
                    <AppSidebar />
                    <main className="flex-1 overflow-x-hidden overflow-y-auto">
                        <SidebarTrigger className="bg-background absolute z-100 rounded-none p-4 pt-4" />
                        <BreadcrumbComponent />
                        {children}
                    </main>
                </div>
            </SidebarProvider>
        </>
    );
}
