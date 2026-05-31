import { LucideIcon } from 'lucide-react';

export type NavMainItem = {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
        title: string;
        url: string;
    }[];
};

export interface SidebarData {
    user: { name: string; email: string; avatar: string };
    navMain: NavMainItem[];
    projects: { name: string; url: string; icon: LucideIcon }[];
}
