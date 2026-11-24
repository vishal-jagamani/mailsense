'use client';

import React from 'react';

import AiFeatureTogglesCard from '@features/settings/components/ai/AiFeatureTogglesCard';
import GlobalAiToggleCard from '@features/settings/components/ai/GlobalAiToggleCard';
import PerAccountAiExclusionCard from '@features/settings/components/ai/PerAccountAiExclusionCard';
import { useAiSettings } from '@features/settings/hooks/useAiSettings';
import { AiSettingsTabProps } from '@features/settings/types/ai-settings.types';
import { Skeleton } from '@shared/ui/skeleton';

const AiSettings: React.FC<AiSettingsTabProps> = ({ className = '' }) => {
    const {
        aiSettings: { data: aiSettingsData, loading: aiSettingsDataLoading },
        accounts: { data: accountsData, loading: accountsDataLoading },
        actions: { handleGlobalToggle, handleFeatureToggle, handleAccountToggle },
        updateAiSettingsLoading,
    } = useAiSettings();

    if (aiSettingsDataLoading || !aiSettingsData || accountsDataLoading || !accountsData) {
        return (
            <div className={`space-y-2 ${className}`}>
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-64 w-full rounded-xl" />
                <Skeleton className="h-48 w-full rounded-xl" />
            </div>
        );
    }

    return (
        <div className={`space-y-3 select-none ${className} h-[calc(100vh-130px)] scrollbar-none overflow-y-auto pr-1 pb-6`}>
            <GlobalAiToggleCard
                enabled={aiSettingsData.settings.enabled}
                consentGivenAt={aiSettingsData.settings.consentGivenAt}
                globalFeatureFlag={aiSettingsData.globalFeatureFlag}
                onToggle={handleGlobalToggle}
                isUpdating={updateAiSettingsLoading}
            />

            <AiFeatureTogglesCard
                features={aiSettingsData.settings.features}
                disabled={!aiSettingsData.settings.enabled}
                onToggleFeature={handleFeatureToggle}
                isUpdating={updateAiSettingsLoading}
            />

            <PerAccountAiExclusionCard
                accounts={accountsData}
                disabledAccountIds={aiSettingsData.settings.disabledAccountIds}
                aiGloballyEnabled={aiSettingsData.settings.enabled}
                onToggleAccount={handleAccountToggle}
                isUpdating={updateAiSettingsLoading}
            />
        </div>
    );
};

export default AiSettings;
