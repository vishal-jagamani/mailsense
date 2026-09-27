import { UseEmailKeyboardShortcutsParams } from '@entities/email';
import { useEffect } from 'react';
import { isInputElement } from '../utils';

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
            try {
                if (isInputElement(event.target)) {
                    return;
                }

                if (event.ctrlKey || event.altKey || event.metaKey) {
                    return;
                }

                const currentEmail = emails[selectedIndex];

                switch (event.key) {
                    case 'j':
                    case 'ArrowDown': {
                        event.preventDefault();
                        if (emails.length > 0) {
                            const nextIndex = Math.min(emails.length - 1, selectedIndex + 1);
                            onSelectIndex(nextIndex);
                        }
                        break;
                    }

                    case 'k':
                    case 'ArrowUp': {
                        event.preventDefault();
                        if (emails.length > 0) {
                            const prevIndex = Math.max(0, selectedIndex - 1);
                            onSelectIndex(prevIndex);
                        }
                        break;
                    }

                    case 'Enter':
                    case 'o': {
                        if (currentEmail) {
                            event.preventDefault();
                            onOpenEmail(currentEmail);
                        }
                        break;
                    }

                    case 's': {
                        if (onStarEmail) {
                            if (selectedEmails.length > 0 || currentEmail) {
                                event.preventDefault();
                                onStarEmail(currentEmail);
                            }
                        }
                        break;
                    }

                    case 'u': {
                        if (onMarkUnread) {
                            if (selectedEmails.length > 0 || currentEmail) {
                                event.preventDefault();
                                onMarkUnread(currentEmail);
                            }
                        }
                        break;
                    }

                    case 'e': {
                        if (onArchiveEmail) {
                            if (selectedEmails.length > 0 || currentEmail) {
                                event.preventDefault();
                                onArchiveEmail(currentEmail);
                            }
                        }
                        break;
                    }

                    case 'Delete':
                    case 'Backspace': {
                        if (onDeleteEmail) {
                            if (selectedEmails.length > 0 || currentEmail) {
                                event.preventDefault();
                                onDeleteEmail(currentEmail);
                            }
                        }
                        break;
                    }

                    case 'c': {
                        if (onOpenCompose) {
                            event.preventDefault();
                            onOpenCompose();
                        }
                        break;
                    }

                    case '/': {
                        event.preventDefault();
                        const searchInput = document.querySelector<HTMLInputElement>(
                            'input[type="search"], input[name="search"], #email-search-input',
                        );
                        if (searchInput) {
                            searchInput.focus();
                            searchInput.select();
                        }
                        break;
                    }

                    case '?': {
                        if (onOpenShortcutsModal) {
                            event.preventDefault();
                            onOpenShortcutsModal();
                        }
                        break;
                    }

                    default:
                        break;
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error('Error handling keyboard navigation shortcut:', errorMessage);
            }
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
