'use client';

import { AudioWaveform, Bot, ChartLine, Command, Folder, Inbox, Mail, Search, Settings, Star } from 'lucide-react';
import * as React from 'react';

import { HOME_ROUTES } from '@/shared/constants';
import { useUser } from '@auth0/nextjs-auth0';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@shared/ui/sidebar';
import { NavMain } from './nav-main';
import { NavProjects } from './nav-projects';
import { NavUser } from './nav-user';
import { TeamSwitcher } from './team-switcher';

// This is sample data.
const data = {
    user: {
        name: 'shadcn',
        email: 'm@example.com',
        avatar: '/avatars/shadcn.jpg',
    },
    teams: [
        {
            name: 'Acme Inc',
            logo: Mail,
            plan: 'Enterprise',
        },
        {
            name: 'Acme Corp.',
            logo: AudioWaveform,
            plan: 'Startup',
        },
        {
            name: 'Evil Corp.',
            logo: Command,
            plan: 'Free',
        },
    ],
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
            title: 'AI Views',
            url: '#',
            icon: Bot,
            items: [
                {
                    title: 'Priority',
                    url: '#',
                },
                {
                    title: 'Categories',
                    url: '#',
                },
                {
                    title: 'Summarized',
                    url: '#',
                },
            ],
        },
        {
            title: 'Starred',
            url: '#',
            icon: Star,
            items: [
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
            ],
        },
        {
            title: 'Folders',
            url: '#',
            icon: Folder,
            items: [
                {
                    title: 'Gmail',
                    url: '#',
                },
                {
                    title: 'Outlook',
                    url: '#',
                },
            ],
        },
        {
            title: 'Search',
            url: '#',
            icon: Search,
        },
    ],
    projects: [
        {
            name: 'Insights',
            url: '#',
            icon: ChartLine,
        },
        {
            name: 'Settings',
            url: '#',
            icon: Settings,
        },
    ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { user } = useUser();
    const userData = {
        name: user?.name ?? '',
        email: user?.email ?? '',
        avatar: user?.picture ?? '',
    };
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <TeamSwitcher teams={data.teams} />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
                <NavProjects projects={data.projects} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={userData} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
