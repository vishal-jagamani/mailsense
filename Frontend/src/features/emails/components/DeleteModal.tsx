'use client';

import React, { useEffect } from 'react';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@shared/ui/alert-dialog';

interface DeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDelete: () => void;
    title?: string;
    description?: string;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ open, onOpenChange, onDelete, title, description }) => {
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (event: KeyboardEvent): void => {
            try {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    event.stopPropagation();
                    onDelete();
                    onOpenChange(false);
                } else if (event.key === 'Escape') {
                    event.preventDefault();
                    event.stopPropagation();
                    onOpenChange(false);
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error('Error handling delete confirmation keydown:', errorMessage);
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [open, onDelete, onOpenChange]);

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="p-4">
                <AlertDialogHeader className="gap-0">
                    <AlertDialogTitle>{title || 'Delete Email'}</AlertDialogTitle>
                    <AlertDialogDescription>{description || 'Are you sure you want to delete this email?'}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => onOpenChange(false)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-orange-800 text-white hover:bg-orange-900"
                        onClick={() => {
                            onDelete();
                            onOpenChange(false);
                        }}
                    >
                        Confirm
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default DeleteModal;
