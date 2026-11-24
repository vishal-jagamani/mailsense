import { SettingOption } from '@shared/types';
import { CheckSquare, FileText, Flag, Info, MessageSquare, Sparkles, User } from 'lucide-react';

export const SETTINGS_OPTIONS: SettingOption[] = [
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
    {
        id: 3,
        name: 'ai',
        title: 'AI & Privacy',
        link: '/settings/ai',
        icon: Sparkles,
    },
    {
        id: 5,
        name: 'about',
        title: 'About',
        link: '/settings/about',
        icon: Info,
    },
] as const;

export const AI_FEATURE_ITEMS = [
    {
        key: 'categorization' as const,
        title: 'Smart Categorization',
        description: 'Automatically classifies inbound messages into Work, Finance, Social, and Promotions.',
        icon: CheckSquare,
    },
    {
        key: 'priorityScoring' as const,
        title: 'Priority Inbox Scoring',
        description: 'Highlights critical and high-urgency emails requiring your direct attention.',
        icon: Flag,
    },
    {
        key: 'summarization' as const,
        title: 'Conversation Summarization',
        description: 'Generates concise executive takeaways and action item checklists on demand.',
        icon: FileText,
    },
    {
        key: 'suggestedReplies' as const,
        title: 'Suggested Quick Replies',
        description: 'Recommends 2-3 contextual responses matching formal, casual, or concise tones.',
        icon: MessageSquare,
    },
];

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
