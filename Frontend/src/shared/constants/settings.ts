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
        name: 'appearance',
        title: 'Appearance',
        link: '/settings/appearance',
        icon: Palette,
    },
    {
        id: 3,
        name: 'privacy',
        title: 'Privacy & Data',
        link: '/settings/privacy',
        icon: Lock,
    },
    {
        id: 4,
        name: 'about',
        title: 'About',
        link: '/settings/about',
        icon: Info,
    },
];
