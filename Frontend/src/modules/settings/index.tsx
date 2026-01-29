'use client';

import { ROUTES, SETTINGS_OPTIONS } from '@/shared/constants';
import { useBreadcrumbStore } from '@/shared/store/breadcrumb.store';
import React, { useEffect } from 'react';
import ProfileSettings from './components/profile/ProfileSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import AccountSettings from './components/account/AccountSettings';

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

export default SettingsPage;
