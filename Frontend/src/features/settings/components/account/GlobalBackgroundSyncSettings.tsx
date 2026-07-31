'use client';

import React from 'react';

import { ACCOUNT_SYNC_MODE, UserAccountSyncSettings } from '@mailsense/types';
import { SYNC_INTERVAL_OPTIONS } from '@shared/constants';
import { Label } from '@shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';
import { Switch } from '@shared/ui/switch';

interface GlobalBackgroundSyncSettingsProps {
    syncSettings: UserAccountSyncSettings;
    handleGlobalAutoSyncToggle: (value: boolean) => void;
    handleSyncModeChange: (mode: ACCOUNT_SYNC_MODE) => void;
    handleGlobalIntervalChange: (value: string) => void;
}

const GlobalBackgroundSyncSettings: React.FC<GlobalBackgroundSyncSettingsProps> = (props) => {
    const { syncSettings, handleGlobalAutoSyncToggle, handleSyncModeChange, handleGlobalIntervalChange } = props;
    return (
        <div className="bg-card space-y-6 rounded-xl border p-4 shadow-sm">
            <div className="space-y-1">
                <Label className="text-md font-semibold">Global Background Sync Settings</Label>
                <Label className="text-muted-foreground text-sm">
                    Configure auto-synchronization behavior across all your connected email accounts.
                </Label>
            </div>
            <div className="border-accent border-0.5 flex justify-between space-y-2">
                <div className="space-y-2">
                    <p className="text-sm leading-none font-semibold">Global Auto-Sync</p>
                    <p className="text-muted-foreground text-xs">Enable or disable automatic background fetching for all connected accounts.</p>
                </div>
                <Switch checked={syncSettings.globalAutoSync} onCheckedChange={handleGlobalAutoSyncToggle} className="cursor-pointer" />
            </div>
            {/* Sync Mode */}
            <div className="flex justify-between space-y-2">
                <Label className="text-sm font-semibold">Sync Mode</Label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div
                        onClick={() => handleSyncModeChange(ACCOUNT_SYNC_MODE.SAME_FOR_ALL)}
                        className={`cursor-pointer rounded-lg border p-3 transition-all ${
                            syncSettings.syncMode === ACCOUNT_SYNC_MODE.SAME_FOR_ALL
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-muted-foreground/30'
                        }`}
                    >
                        <Label className="text-sm font-semibold">Same For All Accounts</Label>
                        <Label className="text-muted-foreground mt-1 text-xs">Enforce a single global sync interval across all mailboxes.</Label>
                    </div>
                    <div
                        onClick={() => handleSyncModeChange(ACCOUNT_SYNC_MODE.CUSTOM_PER_ACCOUNT)}
                        className={`flex cursor-pointer flex-col justify-center rounded-lg border p-3 transition-all ${
                            syncSettings.syncMode === ACCOUNT_SYNC_MODE.CUSTOM_PER_ACCOUNT
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-muted-foreground/30'
                        }`}
                    >
                        <Label className="text-sm font-semibold">Custom Per Account</Label>
                        <Label className="text-muted-foreground mt-1 text-xs">Set individual sync intervals for each connected email mailbox.</Label>
                    </div>
                </div>
            </div>
            {/* Global Interval Select (Enabled when SAME_FOR_ALL) */}
            {syncSettings.syncMode === ACCOUNT_SYNC_MODE.SAME_FOR_ALL && (
                <div className="flex items-center justify-between pt-2">
                    <div className="space-y-1">
                        <Label className="text-sm">Global Sync Frequency</Label>
                        <Label className="text-muted-foreground text-xs">Applied to all connected mailboxes.</Label>
                    </div>
                    <Select value={String(syncSettings.globalSyncInterval)} onValueChange={handleGlobalIntervalChange}>
                        <SelectTrigger className="w-56 text-xs">
                            <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                            {SYNC_INTERVAL_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={String(opt.value)} className="text-xs">
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>
    );
};

export default GlobalBackgroundSyncSettings;
