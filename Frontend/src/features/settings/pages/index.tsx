'use client';

import { Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { Suspense, useEffect } from 'react';

import { ROUTES, SETTINGS_OPTIONS } from '@shared/constants';
import { useBreadcrumbStore } from '@shared/store';
import { SettingsPageProps } from '@shared/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import AboutSettingsStub from '../components/about/AboutSettingsStub';
import AccountSettings from './account';
import AiSettings from './ai';
import ProfileSettings from './profile';

const SettingsPage: React.FC<SettingsPageProps> = ({ setting }) => {
    const router = useRouter();
    const isValidSetting = SETTINGS_OPTIONS.some((option) => option.name === setting);
    const activeTab = setting && isValidSetting ? setting : 'profile';

    useEffect(() => {
        useBreadcrumbStore.setState({
            items: [{ title: 'Settings', url: ROUTES.SETTINGS }],
        });
    }, [activeTab]);

    const handleTabChange = (nextTab: string): void => {
        router.push(`${ROUTES.SETTINGS}/${nextTab}`);
    };

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="-mt-8">
            <TabsList>
                {SETTINGS_OPTIONS.map((option) => (
                    <TabsTrigger key={option.id} value={option.name} className="hover:cursor-pointer">
                        <option.icon className="size-5" />
                        <p className="text-sm">{option.title}</p>
                    </TabsTrigger>
                ))}
            </TabsList>
            <TabsContent value="profile">
                <ProfileSettings />
            </TabsContent>
            <TabsContent value="account">
                <AccountSettings />
            </TabsContent>
            <TabsContent value="ai">
                <AiSettings />
            </TabsContent>
            <TabsContent value="about">
                <AboutSettingsStub />
            </TabsContent>
        </Tabs>
    );
};

const SettingsPageWrapper = ({ setting }: SettingsPageProps) => (
    <Suspense fallback={<Loader />}>
        <SettingsPage setting={setting} />
    </Suspense>
);

export default SettingsPageWrapper;
