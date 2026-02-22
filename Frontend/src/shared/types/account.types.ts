export enum ACCOUNT_PROVIDER {
    GMAIL = 'gmail',
    OUTLOOK = 'outlook',
}
export interface AccountProviders {
    id: number;
    name: string;
    displayName: string;
}

interface GmailUserProfile {
    sub: string;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    email: string;
    email_verified: boolean;
    locale: string;
}

export interface AccountAttributes {
    _id: string;
    id: number;
    userId: string;
    provider: string;
    emailAddress: string;
    userProfileDetails: GmailUserProfile;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiry: number;
    refreshTokenExpiry: number;
    scope: string;
    syncEnabled: boolean;
    syncInterval: number;
    lastSyncedAt: number;
}

export interface GetAccountsResponse {
    data: AccountAttributes[];
}
