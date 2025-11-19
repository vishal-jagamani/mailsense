'use client';

import APILoader from '@/shared/components/apiLoader';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { encrypt } from '@/shared/utils/crypto';
import { useAuthStore } from '@/store';
import React, { useEffect, useState } from 'react';
import { useChangeUserPassword } from '../../services/useSettingsApi';

interface ChangePasswordProps {
    show: boolean;
    setShow: (show: boolean) => void;
    setShowToast: (showToast: boolean) => void;
    setToastType: (toastType: string) => void;
}

const ChangePassword: React.FC<ChangePasswordProps> = ({ show, setShow, setShowToast, setToastType }) => {
    const userId = useAuthStore((state) => state.user?.id);

    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [passwordIsSame, setPasswordIsSame] = useState<boolean>(false);

    const {
        mutate: changeUserPassword,
        data: changeUserPasswordData,
        isPending: changeUserPasswordLoading,
        error: changeUserPasswordError,
    } = useChangeUserPassword();

    const handleChangePasswordButtonClick = () => {
        if (!userId) {
            return;
        }
        changeUserPassword({ userId, data: { password: encrypt(newPassword) } });
    };

    useEffect(() => {
        if (newPassword === confirmPassword) {
            setPasswordIsSame(true);
        } else {
            setPasswordIsSame(false);
        }
    }, [newPassword, confirmPassword]);

    useEffect(() => {
        if (changeUserPasswordData) {
            setShow(false);
            setShowToast(true);
            setToastType('password');
        }
    }, [changeUserPasswordData]);

    return (
        <Dialog open={show} onOpenChange={setShow}>
            <DialogContent className="sm:max-w-[425px]">
                <APILoader show={changeUserPasswordLoading} />
                <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>Change your password here. Click save when you&apos;re done.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                    <div className="grid gap-3">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" name="new-password" type="password" onChange={(e) => setNewPassword(e.target.value)} />
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <Input id="confirm-password" name="confirm-password" type="password" onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" onClick={handleChangePasswordButtonClick} disabled={!passwordIsSame || !newPassword || !confirmPassword}>
                        Save changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ChangePassword;
