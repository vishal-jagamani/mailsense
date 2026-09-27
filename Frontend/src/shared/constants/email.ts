import { DATE_RANGE, KEYBOARD_SHORTCUT_ACTION, KeyboardShortcutGroup } from '@mailsense/types';

export const EMAILS_PAGE_SIZE = 20;

export const DATE_RANGE_DROPDOWN_OPTIONS: { id: number; name: string; label: string }[] = [
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
