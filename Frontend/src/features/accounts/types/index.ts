export interface EnableAccountPayload {
    accountId: string;
    active: boolean;
}

export interface UpdateAccountSettingsPayload {
    syncEnabled?: boolean;
    syncInterval?: number;
    active?: boolean;
}

export interface UpdateAccountSettingsVariables {
    accountId: string;
    settings: UpdateAccountSettingsPayload;
}
