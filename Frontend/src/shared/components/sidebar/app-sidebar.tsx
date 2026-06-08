'use client';

import { useUser } from '@auth0/nextjs-auth0';
import { Pencil } from 'lucide-react';
import React, { useMemo } from 'react';

import { useGetAccountsQuery } from '@features/accounts/api/accounts.queries';
import { cn } from '@lib/utils';
import { HOME_ROUTES, SIDEBAR_DATA } from '@shared/constants';
import { useAuthStore, useComposeEmailPopupStore } from '@shared/store';
import { Button } from '@shared/ui/button';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail, useSidebar } from '@shared/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/tooltip';
import { NavMain } from './nav-main';
import { NavProjects } from './nav-projects';
import { NavUser } from './nav-user';
import { TeamSwitcher } from './team-switcher';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { user } = useUser();
    const { state } = useSidebar();
    const isCollapsed = state === 'collapsed';

    const { openCompose } = useComposeEmailPopupStore();
    const { user: currentUser } = useAuthStore();
    const { data: accounts } = useGetAccountsQuery(currentUser?.id || '', { enabled: !!currentUser?.id });

    const sidebarData = useMemo(() => {
        if (accounts && Array.isArray(accounts)) {
            const inboxItems = accounts.map((acc) => ({
                title: acc.emailAddress,
                url: HOME_ROUTES.ACCOUNT_INBOX(acc._id),
            }));
            const updatedNavMain = SIDEBAR_DATA.navMain.map((item) => {
                if (item.title === 'Inbox') {
                    return { ...item, items: inboxItems };
                }
                return item;
            });
            return {
                ...SIDEBAR_DATA,
                navMain: updatedNavMain,
            };
        }
        return SIDEBAR_DATA;
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
                <div className={cn('mt-4 flex items-center transition-all duration-200', isCollapsed ? 'justify-center px-0' : 'px-4')}>
                    {isCollapsed ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button className="size-8 cursor-pointer rounded-lg p-0 font-semibold" onClick={openCompose}>
                                    <Pencil className="size-4" strokeWidth={2} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right" align="center">
                                Compose
                            </TooltipContent>
                        </Tooltip>
                    ) : (
                        <Button className="w-36 cursor-pointer rounded-lg p-5 text-xs font-semibold md:text-sm" onClick={openCompose}>
                            <Pencil className="size-4" strokeWidth={2} />
                            Compose
                        </Button>
                    )}
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
