'use client';

import React from 'react';

import { KeyboardShortcutsModalProps } from '@entities/email';
import { KeyboardShortcutDefinition, KeyboardShortcutGroup } from '@mailsense/types';
import { DEFAULT_KEYBOARD_SHORTCUT_GROUPS, EMAIL_LABELS } from '@shared/constants';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@shared/ui/dialog';

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
    return (
        <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
            <DialogContent className="max-w-md sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold tracking-tight">{EMAIL_LABELS.KEYBOARD_SHORTCUTS.LABEL}</DialogTitle>
                    <DialogDescription className="text-muted-foreground text-xs">{EMAIL_LABELS.KEYBOARD_SHORTCUTS.DESCRIPTION}</DialogDescription>
                </DialogHeader>

                <div className="mt-4 max-h-[60vh] space-y-6 overflow-y-auto pr-2">
                    {DEFAULT_KEYBOARD_SHORTCUT_GROUPS.map((group: KeyboardShortcutGroup) => (
                        <div key={group.title} className="space-y-3">
                            <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">{group.title}</h3>
                            <div className="divide-border/60 border-border/60 bg-muted/30 divide-y rounded-md border">
                                {group.shortcuts.map((shortcut: KeyboardShortcutDefinition) => (
                                    <div key={shortcut.id} className="flex items-center justify-between px-2 py-2.5 text-xs">
                                        <span className="text-foreground">{shortcut.description}</span>
                                        <kbd className="border-border bg-background text-foreground inline-flex h-6 items-center justify-center rounded border px-2 font-mono text-xs font-medium shadow-sm">
                                            {shortcut.key}
                                        </kbd>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default KeyboardShortcutsModal;
