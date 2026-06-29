'use client';

import ComposeEmail from '@features/emails/components/composeEmail';
import BreadcrumbComponent from '@shared/components/breadcrumb';
import Loader from '@shared/components/loader';
import { AppSidebar } from '@shared/components/sidebar/app-sidebar';
import { useAuthStore } from '@shared/store';
import { SidebarProvider, SidebarTrigger } from '@shared/ui/sidebar';

export default function HomeLayout({ children }: { children: React.ReactNode }) {
    const { isLoading } = useAuthStore();

    if (isLoading) return <Loader />;

    return (
        <>
            <SidebarProvider>
                <div className="flex h-screen w-screen overflow-hidden">
                    <AppSidebar />
                    <main className="flex-1 overflow-hidden overflow-x-hidden">
                        <SidebarTrigger className="bg-background absolute z-100 rounded-none p-4 pt-4" />
                        <BreadcrumbComponent />
                        <ComposeEmail />
                        {children}
                    </main>
                </div>
            </SidebarProvider>
        </>
    );
}
