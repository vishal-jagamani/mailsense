import { Info, Lock, LucideIcon, Palette, User } from 'lucide-react';

export const SETTINGS_OPTIONS: { id: number; name: string; title: string; link: string; icon: LucideIcon }[] = [
    {
        id: 1,
        name: 'profile',
        title: 'Profile',
        link: '/settings/profile',
        icon: User,
    },
    {
        id: 2,
        name: 'account',
        title: 'Account',
        link: '/settings/account',
        icon: User,
    },
    // {
    //     id: 3,
    //     name: 'appearance',
    //     title: 'Appearance',
    //     link: '/settings/appearance',
    //     icon: Palette,
    // },
    // {
    //     id: 4,
    //     name: 'privacy',
    //     title: 'Privacy & Data',
    //     link: '/settings/privacy',
    //     icon: Lock,
    // },
    {
        id: 5,
        name: 'about',
        title: 'About',
        link: '/settings/about',
        icon: Info,
    },
] as const;

export const SYNC_INTERVAL_OPTIONS = [
    { label: 'Every 5 minutes', value: 5 },
    { label: 'Every 10 minutes', value: 10 },
    { label: 'Every 15 minutes', value: 15 },
    { label: 'Every 30 minutes', value: 30 },
    { label: 'Every hour', value: 60 },
    { label: 'Every 6 hours', value: 360 },
    { label: 'Every 12 hours', value: 720 },
    { label: 'Daily (24 hours)', value: 1440 },
] as const;
