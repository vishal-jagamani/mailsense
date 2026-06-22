'use client';

import React, { Suspense, useEffect } from 'react';

import { ROUTES } from '@shared/constants';
import { useBreadcrumbStore } from '@shared/store';
import { Loader } from 'lucide-react';
import ProfileSettings from './profile';

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
            {/* <Tabs defaultValue="profile">
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
            </Tabs> */}
            <ProfileSettings />
        </>
    );
};

const SettingsPageWrapper = ({ setting }: { setting: string }) => (
    <Suspense fallback={<Loader />}>
        <SettingsPage setting={setting} />
    </Suspense>
);

export default SettingsPageWrapper;
