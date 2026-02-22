'use client';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import React from 'react';

interface AccountDeletionModalProps {
    show: boolean;
    setShow: (show: boolean) => void;
}

const AccountDeletionModal: React.FC<AccountDeletionModalProps> = ({ show, setShow }) => {
    return (
        <>
            <Dialog open={show} onOpenChange={setShow}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Deletion of Account</DialogTitle>
                        <DialogDescription>Are you sure you want to delete your account?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        {/* <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button variant="destructive" type="submit" onClick={() => setShow(false)} className="cursor-pointer">
                            Delete Account
                        </Button> */}
                        <p className="text-sm text-orange-300">
                            We&apos;re still building the account deletion feature. It will be available soon — thanks for your patience!
                        </p>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default AccountDeletionModal;
