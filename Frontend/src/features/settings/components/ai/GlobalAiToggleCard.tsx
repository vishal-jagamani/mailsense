'use client';

import { ShieldCheck, Sparkles } from 'lucide-react';
import React from 'react';

import { GlobalAiToggleCardProps } from '@features/settings/types/ai-settings.types';
import { USER_AI_SETTINGS_LABELS } from '@shared/constants';
import { Badge } from '@shared/ui/badge';
import { Switch } from '@shared/ui/switch';

const GlobalAiToggleCard: React.FC<GlobalAiToggleCardProps> = (props) => {
    const { enabled, consentGivenAt, globalFeatureFlag, onToggle, isUpdating } = props;

    return (
        <div className="bg-card rounded-xl border p-4 shadow-sm">
            <div className="flex flex-row items-center justify-between pb-3">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Sparkles className="size-5 text-indigo-500" />
                        <p className="text-base font-semibold">{USER_AI_SETTINGS_LABELS.GLOBAL_AI_TOGGLE.LABEL}</p>
                        {!globalFeatureFlag && (
                            <Badge variant="outline" className="border-amber-500/40 text-xs text-amber-500">
                                Mock Mode
                            </Badge>
                        )}
                    </div>
                    <p className="text-muted-foreground text-xs">{USER_AI_SETTINGS_LABELS.GLOBAL_AI_TOGGLE.DESCRIPTION}</p>
                </div>
                <Switch checked={enabled} disabled={isUpdating} onCheckedChange={onToggle} className="cursor-pointer" />
            </div>
            <div className="text-muted-foreground bg-muted/40 flex items-center gap-2 rounded-lg border p-2.5 text-xs">
                <ShieldCheck className="size-4 shrink-0 text-emerald-500" />
                <span>
                    {USER_AI_SETTINGS_LABELS.GLOBAL_AI_TOGGLE.PRIVACY_POLICY}
                    {consentGivenAt && (
                        <span className="ml-1 opacity-80">(Consent registered on {new Date(consentGivenAt).toLocaleDateString()})</span>
                    )}
                </span>
            </div>
        </div>
    );
};

export default GlobalAiToggleCard;
