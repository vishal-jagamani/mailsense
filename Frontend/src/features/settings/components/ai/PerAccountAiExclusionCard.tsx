'use client';

import { Mail, ShieldAlert } from 'lucide-react';
import React from 'react';

import { PerAccountAiExclusionCardProps } from '@features/settings/types/ai-settings.types';
import { USER_AI_SETTINGS_LABELS } from '@shared/constants';
import { Switch } from '@shared/ui/switch';

const PerAccountAiExclusionCard: React.FC<PerAccountAiExclusionCardProps> = (props) => {
    const { accounts, disabledAccountIds, aiGloballyEnabled, onToggleAccount, isUpdating } = props;

    return (
        <div
            className={`bg-card space-y-8 rounded-xl border p-4 shadow-sm transition-opacity ${!aiGloballyEnabled ? 'pointer-events-none opacity-50' : ''}`}
        >
            <div className="space-y-1">
                <p className="text-base font-semibold">{USER_AI_SETTINGS_LABELS.PER_ACCOUNT_AI_EXCLUSION.LABEL}</p>
                <p className="text-muted-foreground text-xs">{USER_AI_SETTINGS_LABELS.PER_ACCOUNT_AI_EXCLUSION.DESCRIPTION}</p>
            </div>
            <div className="space-y-3 pt-0">
                {accounts.length === 0 ? (
                    <p className="text-muted-foreground py-2 text-xs">No connected accounts found.</p>
                ) : (
                    accounts.map((account) => {
                        const isAccountEnabled = !disabledAccountIds.includes(account._id);
                        return (
                            <div key={account._id} className="bg-card/50 flex items-center justify-between rounded-lg border p-3">
                                <div className="flex items-center gap-3">
                                    <Mail className="text-muted-foreground size-4 shrink-0" />
                                    <div className="space-y-0.5">
                                        <p className="text-sm leading-none font-medium">{account.emailAddress}</p>
                                        <p className="text-muted-foreground text-xs capitalize">
                                            {account.provider} · {isAccountEnabled ? 'AI Active' : 'AI Excluded'}
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    checked={isAccountEnabled}
                                    disabled={!aiGloballyEnabled || isUpdating}
                                    onCheckedChange={(checked) => onToggleAccount(account._id, checked)}
                                    className="ml-4 cursor-pointer"
                                />
                            </div>
                        );
                    })
                )}
                {disabledAccountIds.length > 0 && (
                    <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-600 dark:text-amber-400">
                        <ShieldAlert className="size-4 shrink-0" />
                        <span>{USER_AI_SETTINGS_LABELS.PER_ACCOUNT_AI_EXCLUSION.DISABLED_ACCOUNTS(disabledAccountIds.length)}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PerAccountAiExclusionCard;
