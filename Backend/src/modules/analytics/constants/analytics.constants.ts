import { GMAIL_LABELS, OUTLOOK_FOLDERS } from '@mailsense/types';

export const SENT_FOLDER_IDENTIFIERS: string[] = [GMAIL_LABELS.SENT, OUTLOOK_FOLDERS.SENT, 'sent', 'sentitems', 'SENT'];

export const STARRED_FOLDER_IDENTIFIERS: string[] = [GMAIL_LABELS.STARRED, 'starred', 'STARRED'];

export const EXCLUDED_INCOMING_FOLDERS: string[] = [
    GMAIL_LABELS.SENT,
    GMAIL_LABELS.TRASH,
    GMAIL_LABELS.SPAM,
    OUTLOOK_FOLDERS.SENT,
    OUTLOOK_FOLDERS.DELETED,
    OUTLOOK_FOLDERS.SPAM,
    'sent',
    'sentitems',
    'trash',
    'spam',
    'deleteditems',
];
