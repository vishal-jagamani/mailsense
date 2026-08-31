import { CircleUser, FileText, Folder, Inbox, LayoutDashboard, Settings } from 'lucide-react';
import { SidebarData } from '../types/sidebar.types';
import { HOME_ROUTES, ROUTES } from './routes';

export const SIDEBAR_DATA: SidebarData = {
    user: {
        name: 'shadcn',
        email: 'm@example.com',
        avatar: '/avatars/shadcn.jpg',
    },
    navMain: [
        {
            title: 'Dashboard',
            url: HOME_ROUTES.DASHBOARD,
            icon: LayoutDashboard,
            isActive: true,
        },
        {
            title: 'Inbox',
            url: HOME_ROUTES.UNIFIED_INBOX,
            icon: Inbox,
            isActive: true,
            items: [],
        },
        {
            title: 'Drafts',
            url: HOME_ROUTES.DRAFTS,
            icon: FileText,
            isActive: true,
        },
        {
            title: 'Folders',
            url: HOME_ROUTES.ALL_FOLDERS,
            icon: Folder,
            isActive: true,
        },
    ],
    projects: [
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
