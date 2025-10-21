'use client';

import * as React from 'react';

import { DropdownMenu } from '@shared/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@shared/ui/sidebar';
import { Mail } from 'lucide-react';

export function TeamSwitcher() {
    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <SidebarMenuButton
                        size="lg"
                        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:cursor-pointer"
                    >
                        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                            <Mail className="size-4" />
                        </div>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-medium">MailSense</span>
                        </div>
                    </SidebarMenuButton>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
