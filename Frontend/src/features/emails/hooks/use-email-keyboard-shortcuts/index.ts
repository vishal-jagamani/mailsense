'use client';

import { UseEmailKeyboardShortcutsParams } from '@features/emails/types';
import { isInputElement } from '@features/emails/utils';
import { useEffect } from 'react';
import { evaluateKeyPress } from './useEvaluateKeyPress';

export const useEmailKeyboardShortcuts = (params: UseEmailKeyboardShortcutsParams): void => {
    const {
        emails,
        selectedIndex,
        selectedEmails = [],
        onSelectIndex,
        onOpenEmail,
        onStarEmail,
        onMarkUnread,
        onArchiveEmail,
        onDeleteEmail,
        onOpenCompose,
        onOpenShortcutsModal,
        enabled = true,
    } = params;

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent): void => {
            if (isInputElement(event.target)) {
                return;
            }

            if (event.ctrlKey || event.altKey || event.metaKey) {
                return;
            }

            const currentEmail = emails[selectedIndex];

            evaluateKeyPress({
                event,
                emails,
                selectedIndex,
                selectedEmails,
                currentEmail,
                onSelectIndex,
                onOpenEmail,
                onStarEmail,
                onMarkUnread,
                onArchiveEmail,
                onDeleteEmail,
                onOpenCompose,
                onOpenShortcutsModal,
            });
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [
        enabled,
        emails,
        selectedIndex,
        selectedEmails,
        onSelectIndex,
        onOpenEmail,
        onStarEmail,
        onMarkUnread,
        onArchiveEmail,
        onDeleteEmail,
        onOpenCompose,
        onOpenShortcutsModal,
    ]);
};
