'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import React from 'react';

interface DeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ open, onOpenChange }) => {
    return (
        <>
            <AlertDialog open={open} onOpenChange={onOpenChange}>
                <AlertDialogContent className="p-4">
                    <AlertDialogHeader className="gap-0">
                        <AlertDialogTitle>Delete Email</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to delete this email?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-orange-800 text-white">Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default DeleteModal;
