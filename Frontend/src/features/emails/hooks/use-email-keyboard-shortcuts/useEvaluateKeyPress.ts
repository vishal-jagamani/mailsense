'use client';

import { EvaluateKeyPressActionHandler, UseEvaluateKeyPressParams } from '@features/emails/types/email-hooks.types';

const KEY_ACTIONS: Record<string, EvaluateKeyPressActionHandler> = {
    j: ({ event, emails, selectedIndex, onSelectIndex }) => {
        event.preventDefault();
        if (emails.length > 0) onSelectIndex(Math.min(emails.length - 1, selectedIndex + 1));
    },
    ArrowDown: ({ event, emails, selectedIndex, onSelectIndex }) => {
        event.preventDefault();
        if (emails.length > 0) onSelectIndex(Math.min(emails.length - 1, selectedIndex + 1));
    },
    k: ({ event, emails, selectedIndex, onSelectIndex }) => {
        event.preventDefault();
        if (emails.length > 0) onSelectIndex(Math.max(0, selectedIndex - 1));
    },
    ArrowUp: ({ event, emails, selectedIndex, onSelectIndex }) => {
        event.preventDefault();
        if (emails.length > 0) onSelectIndex(Math.max(0, selectedIndex - 1));
    },
    Enter: ({ event, currentEmail, onOpenEmail }) => {
        if (currentEmail) {
            event.preventDefault();
            onOpenEmail(currentEmail);
        }
    },
    o: ({ event, currentEmail, onOpenEmail }) => {
        if (currentEmail) {
            event.preventDefault();
            onOpenEmail(currentEmail);
        }
    },
    s: ({ event, selectedEmails, currentEmail, onStarEmail }) => {
        if (onStarEmail && (selectedEmails.length > 0 || currentEmail)) {
            event.preventDefault();
            onStarEmail(currentEmail);
        }
    },
    u: ({ event, selectedEmails, currentEmail, onMarkUnread }) => {
        if (onMarkUnread && (selectedEmails.length > 0 || currentEmail)) {
            event.preventDefault();
            onMarkUnread(currentEmail);
        }
    },
    e: ({ event, selectedEmails, currentEmail, onArchiveEmail }) => {
        if (onArchiveEmail && (selectedEmails.length > 0 || currentEmail)) {
            event.preventDefault();
            onArchiveEmail(currentEmail);
        }
    },
    '#': ({ event, selectedEmails, currentEmail, onDeleteEmail }) => {
        if (onDeleteEmail && (selectedEmails.length > 0 || currentEmail)) {
            event.preventDefault();
            onDeleteEmail(currentEmail);
        }
    },
    c: ({ event, onOpenCompose }) => {
        if (onOpenCompose) {
            event.preventDefault();
            onOpenCompose();
        }
    },
    '?': ({ event, onOpenShortcutsModal }) => {
        if (onOpenShortcutsModal) {
            event.preventDefault();
            onOpenShortcutsModal();
        }
    },
};

export const evaluateKeyPress = (params: UseEvaluateKeyPressParams): void => {
    const handler = KEY_ACTIONS[params.event.key];
    if (handler) {
        handler(params);
    }
};
