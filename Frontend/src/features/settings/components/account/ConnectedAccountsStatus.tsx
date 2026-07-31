'use client';

import { RefreshCw } from 'lucide-react';
import React from 'react';

import { AccountAttributes } from '@mailsense/types';
import { Label } from '@shared/ui/label';

interface ConnectedAccountsStatusProps {
    accounts: AccountAttributes[];
}

const ConnectedAccountsStatus: React.FC<ConnectedAccountsStatusProps> = (props) => {
    const { accounts } = props;
    return (
        <div className="space-y-6 overflow-y-auto">
            {/* Global Settings Card */}
            <div className="bg-card space-y-6 rounded-xl border p-4 shadow-sm">
                <div className="space-y-1">
                    <Label className="text-md font-semibold">Connected Accounts Status</Label>
                    <Label className="text-muted-foreground text-sm">Overview of sync status and intervals for connected email mailboxes.</Label>
                </div>
                <div className="divide-border divide-y">
                    {accounts.map((acc) => (
                        <div key={acc._id} className="flex items-center justify-between py-3">
                            <div>
                                <div className="text-sm font-medium">{acc.emailAddress}</div>
                                <div className="text-muted-foreground text-xs capitalize">{acc.provider}</div>
                            </div>
                            <div className="flex items-center space-x-4">
                                {acc.syncInProgress && (
                                    <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                                        <RefreshCw className="size-3 animate-spin" /> Syncing...
                                    </span>
                                )}
                                <div className="text-muted-foreground text-xs">Every {acc.syncInterval} mins</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ConnectedAccountsStatus;
