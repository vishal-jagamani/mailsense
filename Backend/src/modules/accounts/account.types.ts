import { EmailInput } from '@modules/emails/email.model.js';
import { ProjectionType } from 'mongoose';
import { AccountDocument } from './account.model.js';
import { GmailUserProfile } from '@providers/gmail/gmail.types.js';
import { OutlookUserProfile } from '@providers/outlook/outlook.types.js';

// Model types
export interface AccountAttributes {
    id: number;
    userId: string;
    provider: string;
    emailAddress: string;
    userProfileDetails: GmailUserProfile | OutlookUserProfile;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiry: number;
    refreshTokenExpiry: number;
    scope: string;
    syncEnabled: boolean;
    syncInterval: number;
    lastSyncedAt: number;
    lastSyncCursor: string;
}

export interface AccountMetricsAttributes {
    accountId: string;
    totalEmails: number;
    totalThreads: number;
    totalLabels: number;
    totalFolders: number;
    totalContacts: number;
    date: Date;
}

// DB Field Mapping
export interface AccountFetchAccessTokenDBMapping {
    FETCH_ACCESS_TOKEN: { projection: ProjectionType<AccountDocument> };
}

export interface GetAccountEmailsResponse {
    emails: EmailInput[];
    lastSyncCursor: string;
}
