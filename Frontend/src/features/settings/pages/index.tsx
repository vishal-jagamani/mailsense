'use client';

import React, { Suspense, useEffect } from 'react';

import { ROUTES, SETTINGS_OPTIONS } from '@shared/constants';
import { useBreadcrumbStore } from '@shared/store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import { Loader } from 'lucide-react';
import ProfileSettings from './profile';
import AccountSettings from './account';

interface SettingsPageProps {
    setting: string;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ setting }) => {
    useEffect(() => {
        useBreadcrumbStore.setState({
            items: [{ title: 'Settings', url: ROUTES.SETTINGS }],
        });
    }, [setting]);

    return (
        <>
            <Tabs defaultValue="profile" className="-mt-8">
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
            </Tabs>
            {/* <ProfileSettings /> */}
        </>
    );
};

const SettingsPageWrapper = ({ setting }: { setting: string }) => (
    <Suspense fallback={<Loader />}>
        <SettingsPage setting={setting} />
    </Suspense>
);

export default SettingsPageWrapper;
