'use client';

import { type LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@shared/ui/sidebar';

export function NavProjects({ projects }: { projects: { name: string; url: string; icon: LucideIcon }[] }) {
    const router = useRouter();

    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Account</SidebarGroupLabel>
            <SidebarMenu>
                {projects.map((item) => (
                    <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton asChild>
                            <button
                                onClick={() => router.push(item.url)}
                                className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full text-left"
                            >
                                <item.icon />
                                <span>{item.name}</span>
                            </button>
                        </SidebarMenuButton>
                        {/* <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuAction showOnHover>
                                    <MoreHorizontal />
                                    <span className="sr-only">More</span>
                                </SidebarMenuAction>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-48 rounded-lg" side={isMobile ? 'bottom' : 'right'} align={isMobile ? 'end' : 'start'}>
                                <DropdownMenuItem>
                                    <Folder className="text-muted-foreground" />
                                    <span>View Project</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Forward className="text-muted-foreground" />
                                    <span>Share Project</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    <Trash2 className="text-muted-foreground" />
                                    <span>Delete Project</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu> */}
                    </SidebarMenuItem>
                ))}
                {/* <SidebarMenuItem>
                    <SidebarMenuButton className="text-sidebar-foreground/70">
                        <MoreHorizontal className="text-sidebar-foreground/70" />
                        <span>More</span>
                    </SidebarMenuButton>
                </SidebarMenuItem> */}
            </SidebarMenu>
        </SidebarGroup>
    );
}
