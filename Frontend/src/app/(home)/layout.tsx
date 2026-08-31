'use client';

import ComposeEmail from '@features/emails/components/composeEmail';
import BreadcrumbComponent from '@shared/components/breadcrumb';
import { AppSidebar } from '@shared/components/sidebar/app-sidebar';
import { SidebarProvider } from '@shared/ui/sidebar';

export default function HomeLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <div className="flex h-screen w-screen overflow-hidden">
                <AppSidebar />
                <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
                    <BreadcrumbComponent />
                    <ComposeEmail />
                    {children}
                </main>
            </div>
        </SidebarProvider>
    );
}
