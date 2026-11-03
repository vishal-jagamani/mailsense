import React from 'react';

// src/app pages props
export interface RootLayoutProps {
    children: React.ReactNode;
}

export interface AccountsPageParams {
    params: Promise<AccountsPageProps>;
}

export interface EmailPageParams {
    params: Promise<EmailPageProps>;
}

export interface FoldersPageParams {
    params: Promise<FoldersPageParam>;
}

export interface SettingsPageParams {
    params: Promise<SettingsPageProps>;
}

//
export interface AccountsPageProps {
    account: string;
}

export interface EmailPageProps {
    account: string;
    email: string;
}

export interface FoldersPageParam {
    folder: string;
}

export interface SettingsPageProps {
    setting: string;
}
