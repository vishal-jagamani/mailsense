'use client';

import { CircleUser, Folder, Inbox, LucideIcon, Mail, Pencil, Settings } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { useGetAccountsQuery } from '@/modules/accounts/services/useAccountApi';
import { HOME_ROUTES, ROUTES } from '@/shared/constants';
import { useAuthStore } from '@/store';
import { useUser } from '@auth0/nextjs-auth0';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@shared/ui/sidebar';
import { NavMain } from './nav-main';
import { NavProjects } from './nav-projects';
import { NavUser } from './nav-user';
import { TeamSwitcher } from './team-switcher';
import { Button } from '@/shared/ui/button';
import { useComposeEmailPopupStore } from '@/shared/store/composeEmailPopup.store';

type NavMainItem = {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
        title: string;
        url: string;
    }[];
};

type SidebarData = {
    user: { name: string; email: string; avatar: string };
    navMain: NavMainItem[];
    projects: { name: string; url: string; icon: LucideIcon }[];
};

// This is sample data.
const data: SidebarData = {
    user: {
        name: 'shadcn',
        email: 'm@example.com',
        avatar: '/avatars/shadcn.jpg',
    },
    navMain: [
        {
            title: 'Inbox',
            url: HOME_ROUTES.UNIFIED_INBOX,
            icon: Inbox,
            isActive: true,
            items: [
                {
                    title: 'All Mail',
                    url: HOME_ROUTES.UNIFIED_INBOX,
                },
            ],
        },
        {
            title: 'Folders',
            url: HOME_ROUTES.ALL_FOLDERS,
            icon: Folder,
            isActive: true,
        },
        // {
        //     title: 'AI Views',
        //     url: '#',
        //     icon: Bot,
        //     items: [
        //         {
        //             title: 'Priority',
        //             url: '#',
        //         },
        //         {
        //             title: 'Categories',
        //             url: '#',
        //         },
        //         {
        //             title: 'Summarized',
        //             url: '#',
        //         },
        //     ],
        // },
        // {
        //     title: 'Starred',
        //     url: '#',
        //     icon: Star,
        //     items: [
        // {
        //     title: 'Introduction',
        //     url: '#',
        // },
        // {
        //     title: 'Get Started',
        //     url: '#',
        // },
        // {
        //     title: 'Tutorials',
        //     url: '#',
        // },
        // {
        //     title: 'Changelog',
        //     url: '#',
        // },
        //     ],
        // },
        // {
        //     title: 'Folders',
        //     url: '#',
        //     icon: Folder,
        //     items: [
        //         {
        //             title: 'Gmail',
        //             url: '#',
        //         },
        //         {
        //             title: 'Outlook',
        //             url: '#',
        //         },
        //     ],
        // },
        // {
        //     title: 'Search',
        //     url: '#',
        //     icon: Search,
        // },
    ],
    projects: [
        // {
        //     name: 'Insights',
        //     url: '#',
        //     icon: ChartLine,
        // },
        {
            name: 'Connected Accounts',
            url: ROUTES.ACCOUNTS,
            icon: CircleUser,
        },
        {
            name: 'Settings',
            url: ROUTES.SETTINGS,
            icon: Settings,
        },
    ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const [sidebarData, setSidebarData] = useState(data);
    const { user } = useUser();

    const { openCompose } = useComposeEmailPopupStore();
    const { user: currentUser } = useAuthStore();
    const { data: accounts } = useGetAccountsQuery(currentUser?.id || '', { enabled: !!currentUser?.id });

    useEffect(() => {
        if (accounts && Array.isArray(accounts) && sidebarData.navMain?.[0]?.items) {
            const inboxItems = [
                { title: 'All Mail', url: HOME_ROUTES.UNIFIED_INBOX },
                ...accounts.map((acc) => ({
                    title: acc.emailAddress,
                    url: HOME_ROUTES.ACCOUNT_INBOX(acc._id),
                })),
            ];
            const updatedNavMain = sidebarData.navMain.map((item) => {
                if (item.title === 'Inbox') {
                    return { ...item, items: inboxItems };
                }
                return item;
            });
            setSidebarData((prev) => ({
                ...prev,
                navMain: updatedNavMain,
            }));
        }
    }, [accounts]);

    const userData = {
        name: user?.name ?? '',
        email: user?.email ?? '',
        avatar: user?.picture ?? '',
    };

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <TeamSwitcher />
            </SidebarHeader>
            <SidebarContent>
                <div className="mt-4 flex items-center px-4">
                    <Button className="w-36 cursor-pointer rounded-lg p-5 text-xs font-semibold md:text-sm" onClick={openCompose}>
                        <Pencil className="size-4" strokeWidth={2} />
                        Compose
                    </Button>
                </div>
                <NavMain items={sidebarData.navMain || []} />
                <NavProjects projects={sidebarData.projects} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={userData} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
