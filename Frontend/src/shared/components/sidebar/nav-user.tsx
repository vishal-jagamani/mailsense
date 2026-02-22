'use client';

import { ChevronsUpDown, LogOut, Moon, Settings, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';

import { AUTH0_URLS, ROUTES } from '@/shared/constants';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@shared/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@shared/ui/sidebar';

export function NavUser({ user }: { user: { name: string; email: string; avatar: string } }) {
    const { isMobile } = useSidebar();
    const { theme, setTheme } = useTheme();
    const router = useRouter();

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">{user.name}</span>
                                <span className="truncate text-xs">{user.email}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        side={isMobile ? 'bottom' : 'right'}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage src={user.avatar} alt={user.name} />
                                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">{user.name}</span>
                                    <span className="truncate text-xs">{user.email}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {/* <DropdownMenuGroup>
                            <DropdownMenuItem>
                                <User />
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/accounts" className="flex items-center gap-2">
                                    <CircleUser />
                                    <span>Connected Accounts</span>
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator /> */}
                        <DropdownMenuGroup>
                            {/* <DropdownMenuItem>
                                <Bell />
                                Notifcations
                            </DropdownMenuItem> */}
                            <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setTheme(theme === 'dark' ? 'light' : 'dark');
                                }}
                            >
                                {theme === 'dark' ? <Sun /> : <Moon />}
                                Toggle Theme
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(ROUTES.SETTINGS)} className="cursor-pointer">
                                <Settings />
                                Settings
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push(AUTH0_URLS.LOGOUT)} className="cursor-pointer">
                            <LogOut />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
