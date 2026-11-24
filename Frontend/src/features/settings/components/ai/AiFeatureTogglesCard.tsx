'use client';

import React from 'react';

import { AiFeatureTogglesCardProps } from '@features/settings/types/ai-settings.types';
import { AI_FEATURE_ITEMS, USER_AI_SETTINGS_LABELS } from '@shared/constants';
import { Switch } from '@shared/ui/switch';

const AiFeatureTogglesCard: React.FC<AiFeatureTogglesCardProps> = (props) => {
    const { features, disabled, onToggleFeature, isUpdating } = props;

    return (
        <div className={`bg-card space-y-8 rounded-xl border p-4 shadow-sm transition-opacity ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
            <div className="space-y-1">
                <p className="text-base font-semibold">{USER_AI_SETTINGS_LABELS.AI_FEATURES_TOGGLES.LABEL}</p>
                <p className="text-muted-foreground text-xs">{USER_AI_SETTINGS_LABELS.AI_FEATURES_TOGGLES.DESCRIPTION}</p>
            </div>
            <div className="space-y-4">
                {AI_FEATURE_ITEMS.map((item) => (
                    <div key={item.key} className="bg-card/50 flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-start gap-3">
                            <item.icon className="text-primary mt-0.5 size-4 shrink-0" />
                            <div className="space-y-0.5">
                                <p className="text-sm leading-none font-medium">{item.title}</p>
                                <p className="text-muted-foreground text-xs">{item.description}</p>
                            </div>
                        </div>
                        <Switch
                            checked={features[item.key]}
                            disabled={disabled || isUpdating}
                            onCheckedChange={(checked) => onToggleFeature(item.key, checked)}
                            className="ml-4 cursor-pointer"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AiFeatureTogglesCard;
