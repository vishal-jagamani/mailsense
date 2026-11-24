import { CategoryStyle } from '@features/emails/types';
import { DATE_RANGE, EMAIL_AI_CATEGORY, KEYBOARD_SHORTCUT_ACTION, KeyboardShortcutGroup } from '@mailsense/types';
import { DateRangeOption } from '@shared/types';

export const EMAILS_PAGE_SIZE = 20;

export const DATE_RANGE_DROPDOWN_OPTIONS: DateRangeOption[] = [
    {
        id: 1,
        name: DATE_RANGE.TODAY,
        label: 'Today',
    },
    {
        id: 2,
        name: DATE_RANGE.LAST_WEEK,
        label: 'Last Week',
    },
    {
        id: 3,
        name: DATE_RANGE.LAST_MONTH,
        label: 'Last Month',
    },
    {
        id: 4,
        name: DATE_RANGE.LAST_3_MONTHS,
        label: 'Last 3 Months',
    },
    {
        id: 5,
        name: DATE_RANGE.ALL_TIME,
        label: 'All Time',
    },
] as const;

export const DEFAULT_KEYBOARD_SHORTCUT_GROUPS: KeyboardShortcutGroup[] = [
    {
        title: 'Navigation',
        shortcuts: [
            {
                id: KEYBOARD_SHORTCUT_ACTION.NEXT_EMAIL,
                key: 'j / ↓',
                description: 'Select next email',
                category: 'navigation',
            },
            {
                id: KEYBOARD_SHORTCUT_ACTION.PREVIOUS_EMAIL,
                key: 'k / ↑',
                description: 'Select previous email',
                category: 'navigation',
            },
            {
                id: KEYBOARD_SHORTCUT_ACTION.OPEN_EMAIL,
                key: 'Enter / o',
                description: 'Open selected email conversation',
                category: 'navigation',
            },
        ],
    },
    {
        title: 'Actions',
        shortcuts: [
            {
                id: KEYBOARD_SHORTCUT_ACTION.STAR_EMAIL,
                key: 's',
                description: 'Toggle star / flag',
                category: 'actions',
            },
            {
                id: KEYBOARD_SHORTCUT_ACTION.MARK_UNREAD,
                key: 'u',
                description: 'Mark selected email as unread',
                category: 'actions',
            },
            {
                id: KEYBOARD_SHORTCUT_ACTION.ARCHIVE_EMAIL,
                key: 'e',
                description: 'Archive selected email',
                category: 'actions',
            },
            {
                id: KEYBOARD_SHORTCUT_ACTION.DELETE_EMAIL,
                key: 'Del / Backspace',
                description: 'Move email to trash',
                category: 'actions',
            },
        ],
    },
    {
        title: 'Composer & Search',
        shortcuts: [
            {
                id: KEYBOARD_SHORTCUT_ACTION.COMPOSE_EMAIL,
                key: 'c',
                description: 'Compose new message',
                category: 'composer',
            },
            {
                id: KEYBOARD_SHORTCUT_ACTION.FOCUS_SEARCH,
                key: '/',
                description: 'Focus mailbox search bar',
                category: 'general',
            },
            {
                id: KEYBOARD_SHORTCUT_ACTION.SHOW_SHORTCUTS,
                key: '?',
                description: 'Open this shortcuts guide',
                category: 'general',
            },
        ],
    },
] as const;

export const CATEGORY_STYLES: Record<string, CategoryStyle> = {
    [EMAIL_AI_CATEGORY.WORK]: {
        label: 'Work',
        className: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/40',
    },
    [EMAIL_AI_CATEGORY.PERSONAL]: {
        label: 'Personal',
        className: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/40',
    },
    [EMAIL_AI_CATEGORY.FINANCE]: {
        label: 'Finance',
        className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/40',
    },
    [EMAIL_AI_CATEGORY.SOCIAL]: {
        label: 'Social',
        className: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/40',
    },
    [EMAIL_AI_CATEGORY.PROMOTIONS]: {
        label: 'Promotions',
        className: 'bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200/80 dark:border-pink-800/40',
    },
    [EMAIL_AI_CATEGORY.UPDATES]: {
        label: 'Updates',
        className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/40',
    },
    [EMAIL_AI_CATEGORY.GENERAL]: {
        label: 'General',
        className: 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border-slate-200 dark:border-slate-700/40',
    },
} as const;
