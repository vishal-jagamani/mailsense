'use client';

import React from 'react';

import { AccountDeletionModalProps } from '@features/settings/types/settings-component.types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@shared/ui/dialog';

const AccountDeletionModal: React.FC<AccountDeletionModalProps> = ({ show, setShow }) => {
    return (
        <>
            <Dialog open={show} onOpenChange={setShow}>
                <DialogContent className="sm:max-w-106.25">
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
