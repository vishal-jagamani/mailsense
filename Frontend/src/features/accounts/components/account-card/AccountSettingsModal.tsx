'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';

import { useUpdateAccountSettingsMutation } from '@features/accounts/api/accounts.mutations';
import { AccountAttributes } from '@mailsense/types';
import { SYNC_INTERVAL_OPTIONS } from '@shared/constants';
import { Button } from '@shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@shared/ui/dialog';
import { Label } from '@shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';
import { Switch } from '@shared/ui/switch';

interface AccountSettingsModalProps {
    account: AccountAttributes;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({ account, open, onOpenChange }) => {
    const [syncEnabled, setSyncEnabled] = useState(account.syncEnabled ?? true);
    const [syncInterval, setSyncInterval] = useState(account.syncInterval ?? 15);
    const updateSettingsMutation = useUpdateAccountSettingsMutation();

    const handleSave = async () => {
        try {
            await updateSettingsMutation.mutateAsync({
                accountId: account._id,
                settings: {
                    syncEnabled,
                    syncInterval,
                },
            });
            toast.success('Account settings saved');
            onOpenChange(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update account settings');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-106.25">
                <DialogHeader>
                    <DialogTitle>Account Sync Settings</DialogTitle>
                    <DialogDescription>Adjust background synchronization parameters for {account.emailAddress}.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Auto Sync Toggle */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Account Auto-Sync</Label>
                            <p className="text-muted-foreground text-xs">Enable automatic background fetches for this mailbox.</p>
                        </div>
                        <Switch checked={syncEnabled} onCheckedChange={setSyncEnabled} />
                    </div>

                    {/* Sync Interval Selector */}
                    <div className="flex items-center justify-between pt-2">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Sync Frequency</Label>
                            <p className="text-muted-foreground text-xs">How often background sync runs.</p>
                        </div>
                        <Select value={String(syncInterval)} onValueChange={(val) => setSyncInterval(parseInt(val, 10))} disabled={!syncEnabled}>
                            <SelectTrigger className="w-44">
                                <SelectValue placeholder="Select interval" />
                            </SelectTrigger>
                            <SelectContent>
                                {SYNC_INTERVAL_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={String(opt.value)}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={updateSettingsMutation.isPending}>
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AccountSettingsModal;
