'use client';

import { CircleUser, Inbox, LucideIcon, Settings } from 'lucide-react';
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
            setSidebarData((prev) => ({
                ...prev,
                navMain: prev.navMain.map((item) => (item.title === 'Inbox' ? { ...item, items: inboxItems } : item)),
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
