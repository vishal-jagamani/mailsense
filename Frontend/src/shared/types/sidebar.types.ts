import { LucideIcon } from 'lucide-react';

export interface NavSubItem {
    title: string;
    url: string;
}

export interface NavMainItem {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: NavSubItem[];
}

export interface SidebarUser {
    name: string;
    email: string;
    avatar: string;
}

export interface SidebarProject {
    name: string;
    url: string;
    icon: LucideIcon;
}

export interface SidebarTeam {
    name: string;
    logo: React.ElementType;
    plan: string;
}

export interface SidebarData {
    user: SidebarUser;
    navMain: NavMainItem[];
    projects: SidebarProject[];
}

// Component props
export interface NavMainProps {
    items: NavMainItem[];
}

export interface NavProjectsProps {
    projects: SidebarProject[];
}

export interface NavTeamsProps {
    teams: SidebarTeam[];
}

export interface NavUserProps {
    user: SidebarUser;
}
